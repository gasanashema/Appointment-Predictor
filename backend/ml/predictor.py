import pickle
import pandas as pd
import logging
from django.conf import settings
from .model_registry import load_model

logger = logging.getLogger(__name__)

class AppointmentPredictor:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.neighbourhood_encoder = None
        self.ready = False
        self._load_resources()

    def _load_resources(self):
        try:
            self.model = load_model("final_model.pkl")
            
            models_dir = settings.BASE_DIR / 'models'
            with open(models_dir / 'scaler.pkl', 'rb') as f:
                self.scaler = pickle.load(f)
            with open(models_dir / 'neighbourhood_encoder.pkl', 'rb') as f:
                self.neighbourhood_encoder = pickle.load(f)
            with open(models_dir / 'neighbourhood_mode.pkl', 'rb') as f:
                self.neighbourhood_mode = pickle.load(f)
                
            logger.info("Predictor resources loaded.")
            self.ready = True
        except Exception as e:
            logger.error(f"Failed to load predictor resources: {e}")
            self.ready = False
            self.model = None

    def predict(self, data: dict):
        """
        Accepts dictionary input, preprocesses, and predicts.
        Input keys: ScheduledDay, AppointmentDay, Gender, Neighbourhood, 
                    Scholarship, Hipertension, Diabetes, Alcoholism, Handcap, SMS_received, Age
        """
        if not self.model:
            self._load_resources()
            if not self.model:
                return {"error": "Model not loaded"}

        try:
            # Create DataFrame
            df = pd.DataFrame([data])
            
            # Preprocessing (Same steps as FeatureEngineer)
            # 1. Date Features
            df['ScheduledDay'] = pd.to_datetime(df['ScheduledDay']).dt.normalize()
            df['AppointmentDay'] = pd.to_datetime(df['AppointmentDay']).dt.normalize()
            
            df['waiting_time'] = (df['AppointmentDay'] - df['ScheduledDay']).dt.days
            df['waiting_time'] = df['waiting_time'].apply(lambda x: max(0, x))
            df['appointment_day_of_week'] = df['AppointmentDay'].dt.dayofweek
            
            # 2. Encoding
            df['Gender'] = df['Gender'].map({'F': 0, 'M': 1})
            
            # Handle unknown neighbourhood? 
            # If label encoder sees new label, it errors.
            # We should handle it.
            try:
                df['Neighbourhood'] = self.neighbourhood_encoder.transform(df['Neighbourhood'])
            except ValueError:
                # Fallback to mode (most frequent from training)
                if hasattr(self, 'neighbourhood_mode'):
                    df['Neighbourhood'] = self.neighbourhood_mode
                else:
                    df['Neighbourhood'] = 0 # Safety net
            
            # 3. Scaling
            scale_cols = ['Age', 'waiting_time', 'appointment_day_of_week']
            df[scale_cols] = self.scaler.transform(df[scale_cols])
            
            # 4. Reorder columns to match training
            # Columns: Gender, Age, Neighbourhood, Scholarship, Hipertension, Diabetes, Alcoholism, Handcap, SMS_received, waiting_time, appointment_day_of_week
            # Note: training data was X (dropped PatientId, AppointmentID, ScheduledDay, AppointmentDay, No-show).
            # The order matters for sklearn!
            # We need to ensure correct column order.
            # Ideally FeatureEngineer should expose the feature names.
            # Hardcoding for now based on training step:
            # The df passed to smote had: Gender, Age, Neighbourhood, Scholarship, Hipertension, Diabetes, Alcoholism, Handcap, SMS_received, waiting_time, appointment_day_of_week
            # (order depends on how columns were in original DF + new columns appended).
            # Original: Gender, ScheduledDay, AppointmentDay, Age, Neighbourhood, Scholarship, Hipertension, Diabetes, Alcoholism, Handcap, SMS_received, No-show
            # Transformations:
            # drop ScheduledDay, AppointmentDay
            # waiting_time, appointment_day_of_week added.
            # So: Gender, Age, Neighbourhood, Hipertension, Diabetes, Alcoholism, Handcap, SMS_received, waiting_time, appointment_day_of_week
            # Let's expect this order.
            
            feature_order = ['Gender', 'Age', 'Neighbourhood', 'Hipertension', 'Diabetes', 'Alcoholism', 'Handcap', 'SMS_received', 'waiting_time', 'appointment_day_of_week']
            
            # Ensure all cols exist
            for col in feature_order:
                if col not in df.columns:
                    df[col] = 0 # Default?
            
            X_input = df[feature_order]
            
            # Predict
            prediction = self.model.predict(X_input)[0]
            probability = self.model.predict_proba(X_input)[0].tolist()
            
            result = "No-show" if prediction == 1 else "Show"
            
            # Lean Response with percentage
            return {
                "will_show": bool(prediction == 0),
                "probability": probability[0], # Probability of showing up
                "probability_percentage": round(probability[0] * 100, 2)
            }
            
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            return {"error": str(e)}

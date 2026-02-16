import pandas as pd
import numpy as np
import pickle
import logging
from sklearn.preprocessing import StandardScaler, OneHotEncoder, LabelEncoder
from sklearn.compose import ColumnTransformer
from sklearn.model_selection import train_test_split
from imblearn.over_sampling import SMOTE
from django.conf import settings
import os
from db.mongo import get_collection

logger = logging.getLogger(__name__)

class FeatureEngineer:
    def __init__(self):
        self.scaler = StandardScaler()
        self.one_hot_encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
        self.label_encoder = LabelEncoder() # For target
        self.neighbourhood_encoder = LabelEncoder() # Use Label Encoding for high cardinality
        
    def process(self, df: pd.DataFrame):
        logger.info("Starting feature engineering...")
        
        # 1. Date Features
        # Convert to datetime
        df['ScheduledDay'] = pd.to_datetime(df['ScheduledDay']).dt.normalize()
        df['AppointmentDay'] = pd.to_datetime(df['AppointmentDay']).dt.normalize()
        
        # Waiting Time
        df['waiting_time'] = (df['AppointmentDay'] - df['ScheduledDay']).dt.days
        df['waiting_time'] = df['waiting_time'].apply(lambda x: max(0, x)) # No negative wait
        
        # Day of Week
        df['appointment_day_of_week'] = df['AppointmentDay'].dt.dayofweek
        
        # 2. Drop processed/unused columns
        drop_cols = ['PatientId', 'AppointmentID', 'ScheduledDay', 'AppointmentDay']
        df = df.drop(columns=[c for c in drop_cols if c in df.columns])
        
        # 3. Encoding
        # Target: No-show (Yes/No) -> 1/0
        # "No-show" column: 'Yes' means they didn't show up.
        df['No-show'] = df['No-show'].map({'Yes': 1, 'No': 0})
        
        # Gender: F/M -> 0/1
        df['Gender'] = df['Gender'].map({'F': 0, 'M': 1})
        
        # Neighbourhood: Label Encoding
        # Justification: High cardinality (80+). One-Hot would increase dimensionality significantly.
        # Tree models handle Label Encoding well. Logistic Regression might struggle, but data is rich.
        df['Neighbourhood'] = self.neighbourhood_encoder.fit_transform(df['Neighbourhood'])
        
        # 4. Scaling
        # Scale: Age, waiting_time, appointment_day_of_week
        scale_cols = ['Age', 'waiting_time', 'appointment_day_of_week']
        df[scale_cols] = self.scaler.fit_transform(df[scale_cols])
        
        # 5. Handle Imbalance (SMOTE)
        X = df.drop('No-show', axis=1)
        y = df['No-show']
        
        logger.info(f"Class distribution before SMOTE: {y.value_counts().to_dict()}")
        smote = SMOTE(random_state=42)
        X_res, y_res = smote.fit_resample(X, y)
        logger.info(f"Class distribution after SMOTE: {y_res.value_counts().to_dict()}")
        
        # 6. Save Artifacts (Scalers, Encoders)
        self._save_artifacts()
        
        # 7. Persist to MongoDB
        self._persist_features(X_res, y_res, list(X.columns))

        return X_res, y_res

    def _save_artifacts(self):
        models_dir = settings.BASE_DIR / 'models'
        if not models_dir.exists():
            models_dir.mkdir(parents=True)
            
        with open(models_dir / 'scaler.pkl', 'wb') as f:
            pickle.dump(self.scaler, f)
        with open(models_dir / 'neighbourhood_encoder.pkl', 'wb') as f:
            pickle.dump(self.neighbourhood_encoder, f)
        
        logger.info(f"Feature engineering artifacts saved to {models_dir}")

    def _persist_features(self, X, y, feature_names):
        try:
            db_features = get_collection("engineered_features_metadata")
            db_features.delete_many({})
            db_features.insert_one({
                "feature_names": feature_names,
                "shape": X.shape,
                "target_distribution": y.value_counts().to_dict()
            })
            
            # Persist engineered dataset? X and y combined
            # Might be large. But requirements say "Persist... Feature-engineered dataset".
            # We'll do a sample or full if feasible. 100k rows * 10 cols is small (few MB).
            full_data = pd.concat([X, y], axis=1)
            collection = get_collection("engineered_dataset")
            collection.delete_many({})
            # Batch insert
            records = full_data.to_dict(orient='records')
            # Chunking to avoid Mongo document size limits if single doc, but insert_many handles lists.
            # Max message size is 48MB. 100k dicts might exceed.
            chunk_size = 5000
            for i in range(0, len(records), chunk_size):
                collection.insert_many(records[i:i+chunk_size])
                
            logger.info("Engineered dataset persisted to MongoDB.")
        except Exception as e:
            logger.error(f"Failed to persist engineered features: {e}")


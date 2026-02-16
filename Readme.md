# Medical Appointment No-Show Predictor - Project Documentation & Logic Explanation

## 1. Project Overview

This project is a **Django-based REST Backend** designed to predict whether a patient will show up for their medical appointment. It automates the entire Machine Learning (ML) lifecycle—from data ingestion to inference—ensuring a production-ready environment that self-trains on server startup.

### Architecture

- **Backend Framework**: Django + Django REST Framework (DRF)
- **Database**: MongoDB Atlas (stores cleaned data, engineered features, metrics)
- **ML Engine**: Scikit-Learn (Training, Inference), Imbalanced-Learn (SMOTE)
- **Orchestration**: Background threading (`core/startup.py`) triggers the pipeline without blocking the API.

---

## 2. How the Model is Created (The Logic)

The model creation process is fully automated and runs in the background when you start the Django server. Here is the step-by-step logic:

### Step 1: Data Loading & Preprocessing (`ml/data_loader.py`, `ml/preprocessing.py`)

1.  **Ingestion**: The system loads the `dataset.csv` file containing historical appointment records.
2.  **Cleaning**:
    - **Outlier Removal**: Patients with unrealistic ages (e.g., negative ages or excessive outliers based on IQR) are removed.
    - **Missing Values**: Numeric gaps are filled with the median; categorical gaps with the mode.
    - **Persistence**: The cleaned raw data is saved to MongoDB (`cleaned_data` collection) for auditability.

### Step 2: Feature Engineering (`ml/feature_engineering.py`)

Raw data isn't enough for ML. We create meaningful features:

1.  **Waiting Time**: Calculated as `AppointmentDay - ScheduledDay`. This is a crucial predictor (longer waits -> higher no-show risk).
2.  **Day of Week**: Extracted from the appointment date (Monday=0, Sunday=6).
3.  **Encoding**:
    - **Categorical Variables**: `Gender` is mapped to 0/1. `Neighbourhood` is Label Encoded (converted to integers) because there are too many unique neighborhoods for One-Hot Encoding.
    - **Scaling**: `Age`, `waiting_time`, and `day_of_week` are standardized (scaled to mean=0, variance=1) so they contribute equally during training.
4.  **Handling Imbalance (SMOTE)**:
    - **Problem**: In medical datasets, "No-Shows" are usually the minority class (e.g., 20%). A standard model might just predict "Show" 100% of the time to be 80% accurate, which is useless.
    - **Solution**: We use **SMOTE (Synthetic Minority Over-sampling Technique)**. It creates synthetic examples of "No-Shows" to balance the dataset (50/50 split) _during training_, forcing the model to learn the patterns of people who miss appointments.

### Step 3: Model Training & Tuning (`ml/training.py`)

We don't just train one model; we find the best one.

1.  **Algorithms**: We compare:
    - **Logistic Regression**: Good baseline, interpretable.
    - **Decision Tree**: Captures non-linear relationships (e.g., "If wait > 10 days AND age < 30...").
2.  **Hyperparameter Tuning (GridSearchCV)**:
    - For each algorithm, we test multiple settings (e.g., tree depth, regularization strength).
    - We use **Cross-Validation (5-fold)** to ensure the model produces stable results on unseen data.
3.  **Selection**: The system picks the model with the highest **F1-Score** (harmonic mean of Precision and Recall), as Accuracy can be misleading in imbalanced tasks.

### Step 4: Serialization (`ml/model_registry.py`)

- The winning model is saved as `final_model.pkl`.
- Crucial artifacts (`scaler.pkl`, `neighbourhood_encoder.pkl`) are also saved so we can transform new data identically during prediction.

---

## 3. Prediction Logic & Output Explanation

When you send a request to `/api/predict/`, the `AppointmentPredictor` class handles it.

### The Logic

1.  **Input Processing**: The JSON input is converted to a Pandas DataFrame.
2.  **Transformation**: The **exact same** scaling and encoding used during training are applied.
    - _Example_: If `Neighbourhood='JARDIM DA PENHA'` was mapped to `42` during training, it is mapped to `42` here.
3.  **Inference**: The loaded `final_model.pkl` calculates:
    - **Class Prediction**: 0 (Show) or 1 (No-Show).
    - **Probability**: The confidence level (e.g., 80% confident it's a No-Show).

### Explaining Your Output

You received this response:

```json
{
  "prediction": "Show",
  "probability": [1.0, 0.0],
  "raw_prediction": 0
}
```

- **`raw_prediction: 0`**: This is the direct output from the classifier. In our pipeline, we mapped `No-show='No'` to `0` and `No-show='Yes'` to `1`.
  - `0` = **Patient will Show Up**.
  - `1` = **Patient will NOT Show Up**.
- **`prediction: "Show"`**: This is the human-readable translation of `raw_prediction`.
- **`probability: [1.0, 0.0]`**: This array represents `[Probability of Class 0, Probability of Class 1]`.
  - `1.0` (100%): Probability that the patient **Will Show** (Class 0).
  - `0.0` (0%): Probability that the patient **Will No-Show** (Class 1).
  - _Note_: A clean 1.0/0.0 split usually happens with Decision Trees on clear-cut data or if the specific leaf node is pure. Logistic Regression usually gives softer probabilities like `[0.85, 0.15]`.

## 4. Key Files

- `backend/core/startup.py`: The "engine starter" that kicks off training.
- `backend/ml/pipeline_orchestrator.py`: The manager that calls data -> cleaning -> engineering -> training.
- `backend/ml/feature_engineering.py`: Where the "SMOTE" magic happens.
- `backend/api/views.py`: Where your JSON request meets the python logic.

## Project Setup
```markdown
For detailed installation and configuration instructions, please refer to the [Backend README](backend/README.md).
```

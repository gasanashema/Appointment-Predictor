# Medical Appointment No-Show Predictor (Django Backend)

A production-ready Django REST backend that predicts medical appointment no-shows using machine learning.
The system automatically cleans data, trains models, and serves predictions via REST APIs.

## Tech Stack

- **Framework**: Django 5, Django REST Framework
- **Database**: MongoDB Atlas (Data), SQLite (Admin/Auth)
- **ML Libraries**: scikit-learn, pandas, numpy, imbalanced-learn
- **Orchestration**: Background threading for ML pipeline

## Setup Instructions

### 1. Prerequisites

- Python 3.10+
- MongoDB Atlas URI
- Virtual Environment (recommended)

### 2. Installation

```bash
# Clone repository
git clone <repo_url>
cd backend

# Create virtual env
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r ../requirements.txt
```

### 3. Configuration

Create a `.env` file in the project root (or `backend/`):

```ini
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/?appName=Cluster0
```

### 4. Running the Server

```bash
# Run migrations (for admin/auth)
python manage.py migrate

# Start server (triggers ML pipeline automatically)
python manage.py runserver
```

_Note: The ML pipeline starts in a background thread on server startup. Check logs for progress._

## API Endpoints

| Method | Endpoint                 | Description                                         |
| ------ | ------------------------ | --------------------------------------------------- |
| POST   | `/api/train-status/`     | Check ML pipeline status (RUNNING/COMPLETED/FAILED) |
| GET    | `/api/model-metrics/`    | Get evaluation metrics (Accuracy, F1, etc.)         |
| GET    | `/api/cleaned-data/`     | View sample of cleaned data                         |
| GET    | `/api/confusion-matrix/` | Get confusion matrix of best model                  |
| POST   | `/api/predict/`          | Predict No-Show (JSON Input)                        |

### Example Prediction Request

```json
POST /api/predict/
{
    "ScheduledDay": "2016-04-29T18:38:08Z",
    "AppointmentDay": "2016-04-29T00:00:00Z",
    "Gender": "F",
    "Neighbourhood": "JARDIM DA PENHA",
    "Scholarship": 0,
    "Hipertension": 1,
    "Diabetes": 0,
    "Alcoholism": 0,
    "Handcap": 0,
    "SMS_received": 0,
    "Age": 62
}
```

## Project Structure

- `backend/core/`: Settings and Startup logic
- `backend/ml/`: Machine Learning pipeline (Loader, Cleaning, Engineering, Training, Prediction)
- `backend/api/`: REST API Views and Serializers
- `backend/db/`: Database connection utilities

import pandas as pd
import numpy as np
import logging
from db.mongo import get_collection

logger = logging.getLogger(__name__)

def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Perform data cleaning:
    - Drop duplicates
    - Handle missing values (numeric->median, cat->mode)
    - Remove outliers (Age)
    - Persist to MongoDB
    """
    logger.info("Starting data cleaning...")
    initial_shape = df.shape
    
    # 1. Remove duplicates
    df = df.drop_duplicates()
    logger.info(f"Dropped {initial_shape[0] - df.shape[0]} duplicates.")
    
    # 2. Drop irrelevant IDs for training
    # PatientId and AppointmentID are identifiers, not features usually.
    # But we might need them to join back? For now, we assume we don't need them for the model.
    # However, to be safe, we perform cleaning on the whole set, but maybe drop them in feature engineering.
    # The prompt says "Data cleaning: ... Remove duplicates".
    
    # 3. Handle missing values
    # Check for missing values
    if df.isnull().sum().sum() > 0:
        logger.info("Handling missing values...")
        for col in df.columns:
            if df[col].dtype == 'object':
                # Categorical -> Mode
                df[col] = df[col].fillna(df[col].mode()[0])
            else:
                # Numeric -> Median
                df[col] = df[col].fillna(df[col].median())
    
    # 4. Remove outliers using IQR for Age (and maybe others?)
    # Age is the main numeric one susceptible to outliers.
    # Some ages are -1 in this dataset usually.
    # Let's clean Age specifically.
    df = df[(df['Age'] >= 0) & (df['Age'] <= 120)]
    
    # IQR for Age?
    # Age is roughly uniform/skewed. IQR might be aggressive. 
    # But prompt says "Remove outliers using IQR method".
    # We will apply it to numeric columns: Age.
    # Wait, 'ScheduledDay' etc are strings right now.
    
    # First, convert types if needed. 
    # But feature engineering is step 2. 
    # "1. DATA CLEANING ... Remove outliers using IQR method"
    # Usually we need correct types first.
    
    Q1 = df['Age'].quantile(0.25)
    Q3 = df['Age'].quantile(0.75)
    IQR = Q3 - Q1
    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR
    
    # Filter Age outliers - Optional: dataset usually has 0-115.
    # If we apply IQR strictly, we might lose valid elderly data.
    # But I will follow instructions.
    old_len = len(df)
    df = df[(df['Age'] >= lower_bound) & (df['Age'] <= upper_bound)]
    logger.info(f"Removed {old_len - len(df)} outliers based on Age.")
    
    # 5. Persist to MongoDB
    try:
        collection = get_collection("cleaned_data")
        # Convert to records logic: delete old, insert new?
        # For a production pipeline, usually we append or version.
        # But for this assignment, "Persist Cleaned dataset".
        # We'll drop and insert to keep it up to date with the CSV.
        collection.delete_many({})
        # Inserting 100k records might be slow row by row. insert_many is better.
        # Mongo has 16MB doc limit? No, collection has no limit. Batch insertion is fine.
        records = df.to_dict(orient='records')
        if records:
            collection.insert_many(records)
        logger.info("Cleaned data persisted to MongoDB.")
    except Exception as e:
        logger.error(f"Failed to persist cleaned data: {e}")
    
    return df

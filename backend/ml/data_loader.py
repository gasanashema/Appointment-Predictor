import pandas as pd
from django.conf import settings
import logging
import os

logger = logging.getLogger(__name__)

def load_data():
    """Load the dataset from CSV file."""
    try:
        # BASE_DIR is backend/
        # data is in backend/../data/
        csv_path = settings.BASE_DIR.parent / 'data' / 'dataset.csv'
        
        if not csv_path.exists():
            logger.error(f"Dataset not found at {csv_path}")
            raise FileNotFoundError(f"Dataset not found at {csv_path}")
            
        logger.info(f"Loading dataset from {csv_path}")
        df = pd.read_csv(csv_path)
        logger.info(f"Loaded {len(df)} records.")
        return df
    except Exception as e:
        logger.error(f"Error loading data: {e}")
        raise e

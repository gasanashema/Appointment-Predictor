from .data_loader import load_data
from .preprocessing import clean_data
from .feature_engineering import FeatureEngineer
from .training import train_models
import logging

logger = logging.getLogger(__name__)

def run():
    logger.info("Pipeline Orchestrator Started")
    try:
        # 1. Load Data
        df = load_data()
        
        # 2. Clean Data
        df = clean_data(df)
        
        # 3. Feature Engineering
        fe = FeatureEngineer()
        X, y = fe.process(df)
        
        # 4. Train & Evaluate & Save
        train_models(X, y)
        
        logger.info("Pipeline Finished Successfully")
    except Exception as e:
        logger.error(f"Pipeline Failed: {e}", exc_info=True)

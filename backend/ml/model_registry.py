import pickle
import os
import datetime
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

MODELS_DIR = settings.BASE_DIR / 'models'

def save_model(model, name="best_model"):
    """
    Save model to disk using pickle with timestamp versioning.
    Also save as 'final_model.pkl' for easy loading.
    """
    if not MODELS_DIR.exists():
        MODELS_DIR.mkdir(parents=True)
        
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{name}_{timestamp}.pkl"
    filepath = MODELS_DIR / filename
    
    with open(filepath, 'wb') as f:
        pickle.dump(model, f)
        
    logger.info(f"Model saved to {filepath}")
    
    # Save as final_model.pkl (overwrite)
    final_path = MODELS_DIR / 'final_model.pkl'
    with open(final_path, 'wb') as f:
        pickle.dump(model, f)
    logger.info(f"Model updated at {final_path}")

def load_model(name="final_model.pkl"):
    """
    Load model from disk.
    """
    filepath = MODELS_DIR / name
    if not filepath.exists():
        logger.warning(f"Model {name} not found.")
        return None
        
    with open(filepath, 'rb') as f:
        model = pickle.load(f)
    logger.info(f"Model loaded from {filepath}")
    return model

import os
import pymongo
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

_client = None

def get_db_handle():
    global _client
    if _client is None:
        mongo_uri = getattr(settings, "MONGO_URI", None) or os.getenv("MONGO_URI")
        if not mongo_uri:
            logger.error("MONGO_URI not set!")
            raise ValueError("MONGO_URI not set in environment or settings.")
        
        try:
            _client = pymongo.MongoClient(mongo_uri)
            # Check connection
            _client.admin.command('ping')
            logger.info("Connected to MongoDB Atlas successfully.")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise e
            
    db_name = "appointment_predictor" 
    return _client[db_name]

def close_connection():
    global _client
    if _client:
        _client.close()
        _client = None

def get_collection(collection_name):
    db = get_db_handle()
    return db[collection_name]

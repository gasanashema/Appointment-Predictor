import logging
import threading
import os

logger = logging.getLogger(__name__)

def run_startup_pipeline():
    if os.environ.get('RUN_MAIN') != 'true':
        # Avoid running twice in dev mode with reloader
        return

    logger.info("Starting ML Pipeline in background thread...")
    thread = threading.Thread(target=_pipeline_worker)
    thread.daemon = True
    thread.start()

def _pipeline_worker():
    logger.info("ML Pipeline Worker Started")
    from db.mongo import get_collection
    import datetime
    
    status_col = get_collection("pipeline_status")
    
    try:
        status_col.update_one(
            {"_id": "current_status"}, 
            {"$set": {"status": "RUNNING", "start_time": datetime.datetime.now()}}, 
            upsert=True
        )
        
        import ml.pipeline_orchestrator
        ml.pipeline_orchestrator.run()
        
        status_col.update_one(
            {"_id": "current_status"}, 
            {"$set": {"status": "COMPLETED", "end_time": datetime.datetime.now()}}, 
            upsert=True
        )
    except Exception as e:
        logger.error(f"Pipeline Worker Failed: {e}")
        status_col.update_one(
            {"_id": "current_status"}, 
            {"$set": {"status": "FAILED", "error": str(e), "end_time": datetime.datetime.now()}}, 
            upsert=True
        )

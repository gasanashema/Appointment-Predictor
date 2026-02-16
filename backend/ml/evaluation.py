from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import logging

logger = logging.getLogger(__name__)

def evaluate_model(y_true, y_pred):
    """
    Compute Accuracy, Precision, Recall, F1
    """
    logger.info("Evaluating model...")
    metrics = {
        'accuracy': accuracy_score(y_true, y_pred),
        'precision': precision_score(y_true, y_pred),
        'recall': recall_score(y_true, y_pred),
        'f1': f1_score(y_true, y_pred)
    }
    logger.info(f"Metrics: {metrics}")
    return metrics

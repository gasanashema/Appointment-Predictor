import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import GridSearchCV, train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import logging
import pickle
from django.conf import settings
from db.mongo import get_collection
from .evaluation import evaluate_model
from .model_registry import save_model

logger = logging.getLogger(__name__)

def train_models(X, y):
    logger.info("Starting model training...")
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    models_config = {
        'LogisticRegression': {
            'model': LogisticRegression(max_iter=1000, class_weight='balanced'),
            'params': {
                'C': [0.1, 1, 10], 
                'solver': ['liblinear', 'lbfgs']
            }
        },
        'DecisionTree': {
            'model': DecisionTreeClassifier(random_state=42, class_weight='balanced'),
            'params': {
                'max_depth': [5, 10], # Removed 20 and None to prevent overfitting/pure leaves
                'min_samples_leaf': [10, 20, 50], # Force impure leaves for probabilities
                'min_samples_split': [10, 50] 
            }
        },
        'RandomForest': {
            'model': RandomForestClassifier(random_state=42, class_weight='balanced', n_jobs=-1),
            'params': {
                'n_estimators': [50, 100],
                'max_depth': [5, 10],
                'min_samples_leaf': [10, 20]
            }
        }
    }
    best_overall_model = None
    best_overall_score = -1
    best_model_name = ""
    
    results = {}
    
    for name, config in models_config.items():
        logger.info(f"Training {name} with GridSearchCV...")
        grid = GridSearchCV(config['model'], config['params'], cv=5, scoring='f1', n_jobs=-1)
        grid.fit(X_train, y_train)
        
        best_clf = grid.best_estimator_
        y_pred = best_clf.predict(X_test)
        
        # Evaluate
        metrics = evaluate_model(y_test, y_pred)
        metrics['best_params'] = grid.best_params_
        metrics['cv_score'] = grid.best_score_
        
        conf_matrix = confusion_matrix(y_test, y_pred).tolist()
        
        results[name] = {
            'metrics': metrics,
            'confusion_matrix': conf_matrix
        }
        
        logger.info(f"{name} Results: {metrics}")
        
        if metrics['f1'] > best_overall_score:
            best_overall_score = metrics['f1']
            best_overall_model = best_clf
            best_model_name = name
            
    # Save results to Mongo
    try:
        col = get_collection("model_evaluation")
        col.delete_many({}) # simple overwrite for this task
        col.insert_one({
            "results": results,
            "best_model": best_model_name
        })
    except Exception as e:
        logger.error(f"Failed to save evaluation to Mongo: {e}")
        
    logger.info(f"Best Model: {best_model_name} with F1: {best_overall_score}")
    
    # Save Best Model
    save_model(best_overall_model, best_model_name)
    
    return best_overall_model

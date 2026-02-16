import os
import sys
import django

# Setup Django
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

print("Django setup successful.")

# Import ML modules to check syntax
try:
    import ml.data_loader
    import ml.preprocessing
    import ml.feature_engineering
    import ml.training
    import ml.evaluation
    import ml.model_registry
    import ml.pipeline_orchestrator
    import ml.predictor
    print("ML modules imported successfully.")
except ImportError as e:
    print(f"Failed to import ML modules: {e}")
    sys.exit(1)

# Import API modules
try:
    import api.views
    import api.serializers
    import api.urls
    print("API modules imported successfully.")
except ImportError as e:
    print(f"Failed to import API modules: {e}")
    sys.exit(1)

print("Verification passed! System is ready to run.")

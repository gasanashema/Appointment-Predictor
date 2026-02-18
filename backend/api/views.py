from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from db.mongo import get_collection
from ml.predictor import AppointmentPredictor
from .serializers import PredictionInputSerializer, PredictionOutputSerializer

# Global predictor instance to load model once
_predictor = AppointmentPredictor()

class TrainStatusView(APIView):
    def get(self, request):
        status_col = get_collection("pipeline_status")
        status_doc = status_col.find_one({"_id": "current_status"})
        if status_doc:
            status_doc.pop('_id')
            return Response(status_doc)
        return Response({"status": "UNKNOWN"})

    def post(self, request):
        # Trigger training manually? Optional.
        return Response({"message": "Training is triggered automatically on startup."}, status=status.HTTP_200_OK)

class ModelMetricsView(APIView):
    def get(self, request):
        col = get_collection("model_evaluation")
        doc = col.find_one()
        if doc and "results" in doc:
            results = doc["results"]
            # Flatten or strict structure?
            # Return full structure
            if "_id" in doc: doc.pop("_id")
            return Response(doc)
        return Response({"error": "No metrics found"}, status=status.HTTP_404_NOT_FOUND)

class ConfusionMatrixView(APIView):
    def get(self, request):
        col = get_collection("model_evaluation")
        doc = col.find_one()
        if doc and "results" in doc:
            best_model = doc.get("best_model")
            if best_model and best_model in doc["results"]:
                cm = doc["results"][best_model]["confusion_matrix"]
                return Response({"confusion_matrix": cm, "model": best_model})
        return Response({"error": "No confusion matrix found"}, status=status.HTTP_404_NOT_FOUND)

class CleanedDataView(APIView):
    def get(self, request):
        # Return sample of cleaned data
        col = get_collection("cleaned_data")
        # Limit to 10 records for performance
        data = list(col.find().limit(10))
        for d in data:
            if "_id" in d: d.pop("_id")
        return Response(data)

from django.shortcuts import render
from django.views import View

class PredictView(APIView):
    def post(self, request):
        if not _predictor.ready:
             return Response(
                 {"error": "Model not ready. Backend is potentially retraining or failed to connect to DB."},
                 status=status.HTTP_503_SERVICE_UNAVAILABLE
             )

        serializer = PredictionInputSerializer(data=request.data)
        if serializer.is_valid():
            try:
                prediction = _predictor.predict(serializer.validated_data)
                if "error" in prediction:
                   return Response(prediction, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                output_serializer = PredictionOutputSerializer(prediction)
                return Response(output_serializer.data)
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AppointmentsView(View):
    def get(self, request):
        collection = get_collection("appointments")
        appointments = list(collection.find().limit(50)) # Limit for demo
        
        # Sanitize data for template (ensure JSON serializable for the modal)
        sanitized_appointments = []
        for appt in appointments:
            appt['_id'] = str(appt['_id'])
            # Ensure dates are isoformat if they aren't already (seed might have stored them as string or datetime)
            # If they are datetime objects, convert them.
            if hasattr(appt.get('AppointmentDay'), 'isoformat'):
                appt['AppointmentDay'] = appt['AppointmentDay'].isoformat()
            if hasattr(appt.get('ScheduledDay'), 'isoformat'):
                appt['ScheduledDay'] = appt['ScheduledDay'].isoformat()
            sanitized_appointments.append(appt)

        return render(request, 'appointments.html', {'appointments': sanitized_appointments})

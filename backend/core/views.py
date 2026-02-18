from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime
import random

from db.mongo import get_collection


# -------------------------
# PREDICT VIEW
# -------------------------
class PredictView(APIView):

    def post(self, request):
        try:
            age = int(request.data.get("age"))
            gender = request.data.get("gender")
            sms_received = int(request.data.get("sms_received"))

            # Fake ML logic
            probability = round(random.uniform(0.2, 0.95), 2)

            if age > 60 and sms_received == 0:
                prediction_label = "No-Show"
                probability = max(probability, 0.6)
            else:
                prediction_label = "Will Attend"
                probability = min(probability, 0.4)

            # Save to MongoDB
            predictions_col = get_collection("predictions")

            predictions_col.insert_one({
                "age": age,
                "gender": gender,
                "sms_received": sms_received,
                "prediction": prediction_label,
                "probability": probability,
                "created_at": datetime.utcnow()
            })

            return Response({
                "prediction": prediction_label,
                "probability": probability
            })

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


# -------------------------
# HISTORY VIEW
# -------------------------
class PredictionHistoryView(APIView):

    def get(self, request):
        predictions_col = get_collection("predictions")

        data = list(
            predictions_col
            .find({}, {"_id": 0})
            .sort("created_at", -1)
            .limit(10)
        )

        return Response(data)

from rest_framework import serializers

class PredictionInputSerializer(serializers.Serializer):
    ScheduledDay = serializers.DateTimeField()
    AppointmentDay = serializers.DateTimeField()
    Gender = serializers.ChoiceField(choices=['M', 'F'])
    Neighbourhood = serializers.CharField()
    Scholarship = serializers.IntegerField()
    Hipertension = serializers.IntegerField()
    Diabetes = serializers.IntegerField()
    Alcoholism = serializers.IntegerField()
    Handcap = serializers.IntegerField()
    SMS_received = serializers.IntegerField()
    Age = serializers.IntegerField()

class PredictionOutputSerializer(serializers.Serializer):
    prediction = serializers.CharField()
    probability = serializers.ListField(child=serializers.FloatField())
    raw_prediction = serializers.IntegerField()

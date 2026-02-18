from django.urls import path
from .views import TrainStatusView, ModelMetricsView, ConfusionMatrixView, CleanedDataView, PredictView, AppointmentsView

urlpatterns = [
    path('train-status/', TrainStatusView.as_view(), name='train-status'),
    path('model-metrics/', ModelMetricsView.as_view(), name='model-metrics'),
    path('confusion-matrix/', ConfusionMatrixView.as_view(), name='confusion-matrix'),
    path('cleaned-data/', CleanedDataView.as_view(), name='cleaned-data'),
    path('predict/', PredictView.as_view(), name='predict'),
    path('appointments/', AppointmentsView.as_view(), name='appointments'),
]

from django.urls import path
from .views import (
    CheckInView,
    ValidateLocationView,
    AttendanceRecordListView,
    TodaySummaryView,
    QRCodeView,
    AllowedNetworkListCreateView,
    AllowedNetworkDetailView,
    AllowedZoneListCreateView,
    AllowedZoneDetailView,
)

urlpatterns = [
    path('attendance/check-in/', CheckInView.as_view(), name='attendance-checkin'),
    path('attendance/records/', AttendanceRecordListView.as_view(), name='attendance-records'),
    path('attendance/today/', TodaySummaryView.as_view(), name='attendance-today'),
    path('attendance/validate-location/', ValidateLocationView.as_view(), name='validate-location'),
    path('qr/<slug:institution_slug>/', QRCodeView.as_view(), name='qr-code'),
    path('networks/', AllowedNetworkListCreateView.as_view(), name='network-list'),
    path('networks/<int:pk>/', AllowedNetworkDetailView.as_view(), name='network-detail'),
    path('zones/', AllowedZoneListCreateView.as_view(), name='zone-list'),
    path('zones/<int:pk>/', AllowedZoneDetailView.as_view(), name='zone-detail'),
]

from django.urls import path
from .views import AttendanceSummaryView, AbsenceReportView, ExportReportView

urlpatterns = [
    path('reports/attendance-summary/', AttendanceSummaryView.as_view(), name='report-summary'),
    path('reports/absences/', AbsenceReportView.as_view(), name='report-absences'),
    path('reports/export/', ExportReportView.as_view(), name='report-export'),
]

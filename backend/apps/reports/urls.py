from django.urls import path
from .views import ConfiguracionView, ResumenReporteView, ExportarReporteView

urlpatterns = [
    path('configuracion/', ConfiguracionView.as_view(), name='configuracion'),
    path('reportes/resumen/', ResumenReporteView.as_view(), name='reporte-resumen'),
    path('reportes/exportar/', ExportarReporteView.as_view(), name='reporte-exportar'),
]

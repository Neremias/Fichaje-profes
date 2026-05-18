from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import Docente, Usuario


class DocenteInline(admin.StackedInline):
    model = Docente
    can_delete = False
    verbose_name_plural = 'Perfil Docente'


class UsuarioInline(admin.StackedInline):
    model = Usuario
    can_delete = False
    verbose_name_plural = 'Perfil Secretaría'


class CustomUserAdmin(BaseUserAdmin):
    inlines = [DocenteInline, UsuarioInline]


admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)


@admin.register(Docente)
class DocenteAdmin(admin.ModelAdmin):
    list_display = ['user', 'get_email', 'activo']
    list_filter = ['activo']
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'user__email']
    raw_id_fields = ['user']

    @admin.display(description='Email')
    def get_email(self, obj):
        return obj.user.email


@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ['user', 'get_email', 'activo']
    list_filter = ['activo']
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'user__email']
    raw_id_fields = ['user']

    @admin.display(description='Email')
    def get_email(self, obj):
        return obj.user.email

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Institution


@admin.register(Institution)
class InstitutionAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'address', 'created_at']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name', 'slug']


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'institution', 'is_active']
    list_filter = ['role', 'institution', 'is_active']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'dni']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Datos del Sistema', {'fields': ('role', 'institution', 'phone', 'dni')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Datos del Sistema', {'fields': ('role', 'institution', 'phone', 'dni')}),
    )

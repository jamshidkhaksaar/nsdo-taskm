from django.contrib import admin
from .models import User, Department, ActivityLog

@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'target', 'status', 'timestamp', 'ip_address')
    list_filter = ('status', 'action', 'timestamp')
    search_fields = ('user__username', 'action', 'target', 'details')
    ordering = ('-timestamp',)

admin.site.register(User)
admin.site.register(Department) 
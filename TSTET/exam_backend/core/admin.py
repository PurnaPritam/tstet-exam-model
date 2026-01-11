from django.contrib import admin
from django.urls import path
from django.shortcuts import redirect
from django.contrib import messages
from django.http import HttpResponse
from .models import Exam, Section, Question, StudentAttempt, QuestionStatus


class SectionInline(admin.TabularInline):
    model = Section
    extra = 1
    fields = ['part_number', 'name', 'order']


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1
    fields = ['question_number', 'section', 'text', 'option_1', 'option_2', 'option_3', 'option_4', 'correct_option']


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'duration_minutes', 'section_count', 'question_count']
    search_fields = ['name']
    inlines = [SectionInline]

    def section_count(self, obj):
        return obj.sections.count()
    section_count.short_description = 'Sections'

    def question_count(self, obj):
        return Question.objects.filter(exam=obj).count()
    question_count.short_description = 'Questions'

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('clear-history/', self.admin_site.admin_view(self.clear_history_view), name='clear_history'),
        ]
        return custom_urls + urls

    def clear_history_view(self, request):
        if request.method == 'POST':
            status_count = QuestionStatus.objects.count()
            attempt_count = StudentAttempt.objects.count()
            QuestionStatus.objects.all().delete()
            StudentAttempt.objects.all().delete()
            messages.success(request, f'Cleared {attempt_count} attempts and {status_count} statuses.')
            return redirect('admin:core_exam_changelist')
        
        html = f'''
        <!DOCTYPE html>
        <html>
        <head><title>Clear History</title></head>
        <body style="font-family: Arial; padding: 40px; max-width: 600px; margin: 0 auto;">
            <h1>Clear All User History</h1>
            <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <strong>Warning:</strong> This will permanently delete all attempt data.
            </div>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Student Attempts:</strong> {StudentAttempt.objects.count()}</p>
                <p><strong>Question Statuses:</strong> {QuestionStatus.objects.count()}</p>
            </div>
            <form method="post">
                <input type="hidden" name="csrfmiddlewaretoken" value="">
                <button type="submit" style="background: #dc3545; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
                    Confirm Clear History
                </button>
                <a href="/admin/core/exam/" style="margin-left: 10px;">Cancel</a>
            </form>
        </body>
        </html>
        '''
        from django.middleware.csrf import get_token
        html = html.replace('value=""', f'value="{get_token(request)}"')
        return HttpResponse(html)


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ['id', 'exam', 'part_number', 'name', 'question_count', 'order']
    list_filter = ['exam']
    search_fields = ['name']
    inlines = [QuestionInline]

    def question_count(self, obj):
        return obj.questions.count()
    question_count.short_description = 'Questions'


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['id', 'question_number', 'exam', 'section', 'short_text', 'correct_option']
    list_filter = ['exam', 'section']
    search_fields = ['text']
    ordering = ['exam', 'section__order', 'question_number']

    def short_text(self, obj):
        return obj.text[:50] + '...' if len(obj.text) > 50 else obj.text
    short_text.short_description = 'Question Text'


@admin.register(StudentAttempt)
class StudentAttemptAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'exam', 'started_at']
    list_filter = ['exam', 'user']
    search_fields = ['user__username', 'exam__name']
    actions = ['delete_all_attempts']

    @admin.action(description='Delete ALL attempts')
    def delete_all_attempts(self, request, queryset):
        QuestionStatus.objects.all().delete()
        count = StudentAttempt.objects.count()
        StudentAttempt.objects.all().delete()
        messages.success(request, f'Deleted all {count} attempts.')
from django.urls import path
from .views import get_exams, get_exam_questions, get_exam_sections, submit_exam, get_user_attempts

urlpatterns = [
    path('exams/', get_exams, name='get_exams'),
    path('exam/<int:exam_id>/sections/', get_exam_sections, name='get_exam_sections'),
    path('exam/<int:exam_id>/questions/', get_exam_questions, name='get_exam_questions'),
    path('submit-exam/', submit_exam, name='submit_exam'),
    path('user-attempts/', get_user_attempts, name='user_attempts'),
]
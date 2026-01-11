from django.db import models
from django.contrib.auth.models import User

class Exam(models.Model):
    name = models.CharField(max_length=200)
    duration_minutes = models.IntegerField(default=150)

    def __str__(self):
        return self.name

class Section(models.Model):
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='sections')
    name = models.CharField(max_length=200)
    part_number = models.IntegerField(default=1)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order', 'part_number']

    def __str__(self):
        return f"Part {self.part_number}: {self.name}"

class Question(models.Model):
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE)
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='questions', null=True, blank=True)
    question_number = models.IntegerField(default=1)
    text = models.TextField()
    option_1 = models.CharField(max_length=500)
    option_2 = models.CharField(max_length=500)
    option_3 = models.CharField(max_length=500)
    option_4 = models.CharField(max_length=500)
    correct_option = models.IntegerField(choices=[(1,'1'), (2,'2'), (3,'3'), (4,'4')])

    class Meta:
        ordering = ['section__order', 'question_number']

    def __str__(self):
        return f"Q{self.question_number}: {self.text[:50]}"

class StudentAttempt(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE)
    started_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.exam.name}"

class QuestionStatus(models.Model):
    attempt = models.ForeignKey(StudentAttempt, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_option = models.IntegerField(null=True, blank=True)
    status = models.CharField(max_length=20, default='not_visited', choices=[
        ('not_visited', 'Not Visited'),
        ('not_answered', 'Not Answered'),
        ('answered', 'Answered'),
        ('marked', 'Marked for Review'),
        ('ans_marked', 'Answered & Marked')
    ])
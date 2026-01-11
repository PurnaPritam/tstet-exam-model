from rest_framework import serializers
from .models import Exam, Section, Question

class QuestionSerializer(serializers.ModelSerializer):
    section_id = serializers.IntegerField(source='section.id', allow_null=True)
    section_name = serializers.CharField(source='section.name', allow_null=True)
    part_number = serializers.IntegerField(source='section.part_number', allow_null=True)

    class Meta:
        model = Question
        fields = ['id', 'question_number', 'text', 'option_1', 'option_2', 'option_3', 'option_4', 'correct_option', 'section_id', 'section_name', 'part_number']

class SectionSerializer(serializers.ModelSerializer):
    question_count = serializers.SerializerMethodField()

    class Meta:
        model = Section
        fields = ['id', 'name', 'part_number', 'order', 'question_count']

    def get_question_count(self, obj):
        return obj.questions.count()

class ExamSerializer(serializers.ModelSerializer):
    sections = SectionSerializer(many=True, read_only=True)
    total_questions = serializers.SerializerMethodField()

    class Meta:
        model = Exam
        fields = ['id', 'name', 'duration_minutes', 'sections', 'total_questions']

    def get_total_questions(self, obj):
        return Question.objects.filter(exam=obj).count()
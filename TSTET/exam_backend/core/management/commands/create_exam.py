import os
from django.core.management.base import BaseCommand
from core.models import Exam, Section, Question


class Command(BaseCommand):
    help = 'Create an exam with sections and questions'

    def add_arguments(self, parser):
        parser.add_argument('--name', type=str, help='Exam name')
        parser.add_argument('--duration', type=int, default=150, help='Duration in minutes')
        parser.add_argument('--sample', action='store_true', help='Create a sample TSTET exam')

    def handle(self, *args, **options):
        if options['sample']:
            self.create_sample_tstet_exam()
        elif options['name']:
            exam = Exam.objects.create(
                name=options['name'],
                duration_minutes=options['duration']
            )
            self.stdout.write(self.style.SUCCESS(f'Created exam: {exam.name} (ID: {exam.id})'))
        else:
            self.stdout.write(self.style.ERROR('Provide --name or use --sample'))

    def create_sample_tstet_exam(self):
        # Delete existing sample exam if exists
        Exam.objects.filter(name='TSTET Paper 1 - 2024').delete()
        
        exam = Exam.objects.create(
            name='TSTET Paper 1 - 2024',
            duration_minutes=150
        )
        self.stdout.write(f'Created exam: {exam.name}')

        sections_data = [
            {'name': 'Child Development & Pedagogy', 'part_number': 1, 'order': 1, 'count': 30},
            {'name': 'Language I - Telugu', 'part_number': 2, 'order': 2, 'count': 30},
            {'name': 'Language II - English', 'part_number': 3, 'order': 3, 'count': 30},
            {'name': 'Mathematics', 'part_number': 4, 'order': 4, 'count': 30},
            {'name': 'Environmental Studies', 'part_number': 5, 'order': 5, 'count': 30},
        ]

        question_num = 1
        for sec_data in sections_data:
            section = Section.objects.create(
                exam=exam,
                name=sec_data['name'],
                part_number=sec_data['part_number'],
                order=sec_data['order']
            )
            self.stdout.write(f'  Created section: {section.name}')

            for i in range(sec_data['count']):
                Question.objects.create(
                    exam=exam,
                    section=section,
                    question_number=question_num,
                    text=f'Sample question {question_num} for {sec_data["name"]}',
                    option_1='Option A',
                    option_2='Option B',
                    option_3='Option C',
                    option_4='Option D',
                    correct_option=((i % 4) + 1)
                )
                question_num += 1

        self.stdout.write(self.style.SUCCESS(f'Created {question_num - 1} questions across 5 sections'))

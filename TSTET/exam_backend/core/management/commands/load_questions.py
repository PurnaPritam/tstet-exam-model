import json
from django.core.management.base import BaseCommand
from core.models import Exam, Section, Question


class Command(BaseCommand):
    help = 'Load questions from a JSON file'

    def add_arguments(self, parser):
        parser.add_argument('file', type=str, help='Path to JSON file')
        parser.add_argument('--exam-id', type=int, help='Exam ID to add questions to')
        parser.add_argument('--clear', action='store_true', help='Clear existing questions first')

    def handle(self, *args, **options):
        try:
            with open(options['file'], 'r', encoding='utf-8') as f:
                data = json.load(f)
        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f'File not found: {options["file"]}'))
            return
        except json.JSONDecodeError as e:
            self.stdout.write(self.style.ERROR(f'Invalid JSON: {e}'))
            return

        # Get or create exam
        if options['exam_id']:
            try:
                exam = Exam.objects.get(id=options['exam_id'])
            except Exam.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'Exam ID {options["exam_id"]} not found'))
                return
        else:
            exam_data = data.get('exam', {})
            exam, created = Exam.objects.get_or_create(
                name=exam_data.get('name', 'Imported Exam'),
                defaults={'duration_minutes': exam_data.get('duration', 150)}
            )
            if created:
                self.stdout.write(f'Created exam: {exam.name}')
            else:
                self.stdout.write(f'Using existing exam: {exam.name}')

        if options['clear']:
            Question.objects.filter(exam=exam).delete()
            Section.objects.filter(exam=exam).delete()
            self.stdout.write('Cleared existing questions and sections')

        # Create sections
        sections_map = {}
        for sec_data in data.get('sections', []):
            section, _ = Section.objects.get_or_create(
                exam=exam,
                name=sec_data['name'],
                defaults={
                    'part_number': sec_data.get('part_number', 1),
                    'order': sec_data.get('order', 0)
                }
            )
            sections_map[sec_data['name']] = section
            self.stdout.write(f'  Section: {section.name}')

        # Create questions
        count = 0
        for q_data in data.get('questions', []):
            section = sections_map.get(q_data.get('section_name'))
            Question.objects.create(
                exam=exam,
                section=section,
                question_number=q_data.get('question_number', count + 1),
                text=q_data['text'],
                option_1=q_data['options'][0],
                option_2=q_data['options'][1],
                option_3=q_data['options'][2],
                option_4=q_data['options'][3],
                correct_option=q_data.get('correct_option', 1)
            )
            count += 1

        self.stdout.write(self.style.SUCCESS(f'Loaded {count} questions'))

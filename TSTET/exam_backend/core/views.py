from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .models import Question, Exam, Section, StudentAttempt, QuestionStatus
from .serializers import QuestionSerializer, ExamSerializer, SectionSerializer
import uuid

# Simple token storage - NOTE: This resets when server restarts!
# For production, use database or Django REST Framework's Token model
user_tokens = {}

@api_view(['POST'])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(username=username, password=password)
    if user:
        # Generate new token
        token = str(uuid.uuid4())
        user_tokens[token] = user.id
        print(f"Login successful. Token: {token[:8]}..., User: {username}, Total tokens: {len(user_tokens)}")
        return Response({'token': token, 'user_id': user.id})
    return Response({'error': 'Invalid credentials'}, status=401)

def verify_token(request):
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if not auth_header:
        print("No auth header found")
        return None
    try:
        parts = auth_header.split()
        if len(parts) != 2 or parts[0] != 'Token':
            print(f"Invalid auth header format: {auth_header}")
            return None
        token = parts[1]
        if token in user_tokens:
            return user_tokens[token]
        else:
            print(f"Token not found in user_tokens. Token: {token[:8]}..., Available: {len(user_tokens)} tokens")
            return None
    except Exception as e:
        print(f"Token verification error: {e}")
        return None

@api_view(['GET'])
def get_exams(request):
    user_id = verify_token(request)
    if not user_id:
        return Response({'error': 'Unauthorized'}, status=401)
    
    exams = Exam.objects.all()
    serializer = ExamSerializer(exams, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_exam_sections(request, exam_id):
    user_id = verify_token(request)
    if not user_id:
        return Response({'error': 'Unauthorized'}, status=401)
    
    sections = Section.objects.filter(exam_id=exam_id).order_by('order', 'part_number')
    serializer = SectionSerializer(sections, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_exam_questions(request, exam_id):
    user_id = verify_token(request)
    if not user_id:
        return Response({'error': 'Unauthorized'}, status=401)
    
    questions = Question.objects.filter(exam_id=exam_id).select_related('section').order_by('section__order', 'question_number')
    serializer = QuestionSerializer(questions, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def submit_exam(request):
    """Save exam attempt to database"""
    user_id = verify_token(request)
    if not user_id:
        return Response({'error': 'Unauthorized'}, status=401)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    
    exam_id = request.data.get('exam_id')
    answers = request.data.get('answers', [])
    
    try:
        exam = Exam.objects.get(id=exam_id)
    except Exam.DoesNotExist:
        return Response({'error': 'Exam not found'}, status=404)
    
    # Check if already attempted
    existing = StudentAttempt.objects.filter(user=user, exam=exam).first()
    if existing:
        return Response({'error': 'Already attempted', 'attempt_id': existing.id}, status=400)
    
    # Create attempt record
    attempt = StudentAttempt.objects.create(user=user, exam=exam)
    
    # Calculate scores per section
    section_scores = {}
    total_correct = 0
    total_questions = 0
    
    for ans in answers:
        question_id = ans.get('question_id')
        selected = ans.get('selected_option')
        
        try:
            question = Question.objects.select_related('section').get(id=question_id)
            total_questions += 1
            
            section_id = question.section.id if question.section else 0
            if section_id not in section_scores:
                section_scores[section_id] = {'correct': 0, 'total': 0, 'name': question.section.name if question.section else 'General'}
            
            section_scores[section_id]['total'] += 1
            
            is_correct = False
            if selected is not None:
                is_correct = (selected + 1) == question.correct_option
                if is_correct:
                    total_correct += 1
                    section_scores[section_id]['correct'] += 1
            
            status = 'answered' if selected is not None else 'not_answered'
            QuestionStatus.objects.create(
                attempt=attempt,
                question=question,
                selected_option=selected,
                status=status
            )
        except Question.DoesNotExist:
            continue
    
    return Response({
        'message': 'Exam submitted successfully',
        'attempt_id': attempt.id,
        'score': total_correct,
        'total': total_questions,
        'section_scores': section_scores
    })

@api_view(['GET'])
def get_user_attempts(request):
    """Get all attempts for current user with scores"""
    user_id = verify_token(request)
    if not user_id:
        return Response({'error': 'Unauthorized'}, status=401)
    
    attempts = StudentAttempt.objects.filter(user_id=user_id).select_related('exam')
    
    result = []
    for attempt in attempts:
        statuses = QuestionStatus.objects.filter(attempt=attempt).select_related('question__section')
        total = statuses.count()
        correct = 0
        
        section_scores = {}
        for status in statuses:
            section = status.question.section
            section_id = section.id if section else 0
            section_name = section.name if section else 'General'
            
            if section_id not in section_scores:
                section_scores[section_id] = {'name': section_name, 'correct': 0, 'total': 0}
            
            section_scores[section_id]['total'] += 1
            
            if status.selected_option is not None:
                if (status.selected_option + 1) == status.question.correct_option:
                    correct += 1
                    section_scores[section_id]['correct'] += 1
        
        result.append({
            'exam_id': attempt.exam.id,
            'exam_name': attempt.exam.name,
            'score': correct,
            'total': total,
            'section_scores': section_scores,
            'attempted_at': attempt.started_at.isoformat()
        })
    
    return Response(result)
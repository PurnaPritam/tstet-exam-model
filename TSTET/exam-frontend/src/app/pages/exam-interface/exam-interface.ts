import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface Section {
  id: number;
  name: string;
  part_number: number;
  startIndex: number;
  endIndex: number;
}

interface Question {
  id: number;
  question_number: number;
  text: string;
  options: string[];
  selectedOption: number | null;
  correctOption: number;
  sectionId: number | null;
  sectionName: string;
  status: 'not_visited' | 'not_answered' | 'answered' | 'marked' | 'ans_marked';
}

@Component({
  selector: 'app-exam-interface',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exam-interface.html',
  styleUrls: ['./exam-interface.css']
})
export class ExamInterfaceComponent implements OnInit, OnDestroy {
  questions: Question[] = [];
  sections: Section[] = [];
  currentQIndex: number = 0;
  currentSectionIndex: number = 0;
  displayTime: string = "150:00";
  timerInterval: any;
  examName: string = "Exam";
  examId: number = 0;
  username: string = '';

  constructor(
    private http: HttpClient, 
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem('user_token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const resultsExist = localStorage.getItem('examResults');
    if (resultsExist) {
      this.router.navigate(['/score']);
      return;
    }

    const selectedExamId = localStorage.getItem('selectedExamId');
    if (!selectedExamId) {
      this.router.navigate(['/login']);
      return;
    }

    this.examId = parseInt(selectedExamId, 10);
    this.examName = localStorage.getItem('selectedExamName') || 'Exam';
    this.username = localStorage.getItem('username') || 'Student';
    
    const savedIndex = localStorage.getItem(`exam_${this.examId}_currentIndex`);
    if (savedIndex) {
      this.currentQIndex = parseInt(savedIndex, 10);
    }
    
    this.fetchQuestions(token);
    this.startRobustTimer();
  }

  fetchQuestions(token: string) {
    const headers = new HttpHeaders().set('Authorization', `Token ${token}`);

    this.http.get<any[]>(`http://127.0.0.1:8000/api/exam/${this.examId}/questions/`, { headers }).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.questions = data.map((q, index) => ({
            id: q.id,
            question_number: q.question_number || (index + 1),
            text: q.text,
            options: [q.option_1, q.option_2, q.option_3, q.option_4],
            selectedOption: null,
            correctOption: q.correct_option - 1,
            sectionId: q.section_id,
            sectionName: q.section_name || 'General Section',
            status: 'not_visited'
          }));

          // Build sections from questions
          this.buildSections();
          
          if (this.questions.length > 0) {
            this.questions[0].status = 'not_answered';
          }
        } else {
          this.loadDummyQuestions();
        }
        
        this.restoreSavedAnswers();
        this.updateCurrentSection();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch questions:', err);
        this.loadDummyQuestions();
        this.restoreSavedAnswers();
        this.cdr.detectChanges();
      }
    });
  }

  buildSections() {
    const sectionMap = new Map<number, Section>();
    let currentIndex = 0;

    this.questions.forEach((q, index) => {
      const sectionId = q.sectionId || 0;
      if (!sectionMap.has(sectionId)) {
        sectionMap.set(sectionId, {
          id: sectionId,
          name: q.sectionName,
          part_number: sectionMap.size + 1,
          startIndex: index,
          endIndex: index
        });
      } else {
        const section = sectionMap.get(sectionId)!;
        section.endIndex = index;
      }
    });

    this.sections = Array.from(sectionMap.values());
  }

  loadDummyQuestions() {
    const sectionData = [
      { name: 'Child Development & Pedagogy', count: 30 },
      { name: 'Language I: Telugu', count: 30 },
      { name: 'Language II: English', count: 30 },
      { name: 'Mathematics', count: 30 },
      { name: 'Science', count: 30 }
    ];

    let questionNum = 1;
    this.questions = [];

    sectionData.forEach((section, sectionIndex) => {
      for (let i = 0; i < section.count; i++) {
        this.questions.push({
          id: questionNum,
          question_number: questionNum,
          text: `Question ${questionNum}: Sample question for ${section.name}`,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          selectedOption: null,
          correctOption: Math.floor(Math.random() * 4),
          sectionId: sectionIndex + 1,
          sectionName: section.name,
          status: 'not_visited'
        });
        questionNum++;
      }
    });

    this.buildSections();
    if (this.questions.length > 0) {
      this.questions[0].status = 'not_answered';
    }
  }

  restoreSavedAnswers() {
    const savedAnswers = localStorage.getItem(`exam_${this.examId}_answers`);
    if (savedAnswers) {
      const answers = JSON.parse(savedAnswers);
      answers.forEach((saved: any) => {
        const question = this.questions.find(q => q.id === saved.questionId);
        if (question) {
          question.selectedOption = saved.selectedOption;
          question.status = saved.status;
        }
      });
    }
  }

  saveCurrentAnswers() {
    const answers = this.questions.map(q => ({
      questionId: q.id,
      selectedOption: q.selectedOption,
      status: q.status
    }));
    localStorage.setItem(`exam_${this.examId}_answers`, JSON.stringify(answers));
    localStorage.setItem(`exam_${this.examId}_currentIndex`, this.currentQIndex.toString());
  }

  updateCurrentSection() {
    for (let i = 0; i < this.sections.length; i++) {
      if (this.currentQIndex >= this.sections[i].startIndex && 
          this.currentQIndex <= this.sections[i].endIndex) {
        this.currentSectionIndex = i;
        break;
      }
    }
  }

  startRobustTimer() {
    const DURATION_MINUTES = 150;
    let endTimeStr = localStorage.getItem('examEndTime');
    let endTime: number;

    if (endTimeStr) {
      endTime = parseInt(endTimeStr, 10);
      if (endTime < new Date().getTime()) {
        this.submitExam();
        return;
      }
    } else {
      endTime = new Date().getTime() + (DURATION_MINUTES * 60 * 1000);
      localStorage.setItem('examEndTime', endTime.toString());
    }

    this.updateTimerDisplay(endTime);

    this.timerInterval = setInterval(() => {
      this.updateTimerDisplay(endTime);
      this.cdr.detectChanges();
    }, 1000);
  }

  updateTimerDisplay(endTime: number) {
    const now = new Date().getTime();
    const distance = endTime - now;

    if (distance < 0) {
      clearInterval(this.timerInterval);
      this.displayTime = "00:00";
      this.submitExam();
    } else {
      const totalSeconds = Math.floor(distance / 1000);
      const m = Math.floor(totalSeconds / 60);
      const s = totalSeconds % 60;
      this.displayTime = `${this.pad(m)}:${this.pad(s)}`;
    }
  }

  pad(n: number): string {
    return n < 10 ? '0' + n : n.toString();
  }

  selectOption(optIndex: number) {
    this.questions[this.currentQIndex].selectedOption = optIndex;
    this.saveCurrentAnswers();
  }

  saveAndNext() {
    const q = this.questions[this.currentQIndex];
    q.status = (q.selectedOption !== null) ? 'answered' : 'not_answered';
    this.saveCurrentAnswers();
    this.moveToNext();
  }

  markForReview() {
    const q = this.questions[this.currentQIndex];
    q.status = (q.selectedOption !== null) ? 'ans_marked' : 'marked';
    this.saveCurrentAnswers();
    this.moveToNext();
  }

  clearResponse() {
    this.questions[this.currentQIndex].selectedOption = null;
    this.questions[this.currentQIndex].status = 'not_answered';
    this.saveCurrentAnswers();
  }

  moveToNext() {
    if (this.currentQIndex < this.questions.length - 1) {
      this.currentQIndex++;
      if (this.questions[this.currentQIndex].status === 'not_visited') {
        this.questions[this.currentQIndex].status = 'not_answered';
      }
      this.updateCurrentSection();
      this.saveCurrentAnswers();
    }
  }

  jumpToQuestion(index: number) {
    this.currentQIndex = index;
    if (this.questions[index].status === 'not_visited') {
      this.questions[index].status = 'not_answered';
    }
    this.updateCurrentSection();
    this.saveCurrentAnswers();
  }

  jumpToSection(sectionIndex: number) {
    const section = this.sections[sectionIndex];
    this.jumpToQuestion(section.startIndex);
  }

  getSectionQuestions(section: Section): Question[] {
    return this.questions.slice(section.startIndex, section.endIndex + 1);
  }

  getCurrentSectionName(): string {
    if (this.sections.length > 0 && this.currentSectionIndex < this.sections.length) {
      return this.sections[this.currentSectionIndex].name;
    }
    return 'General Section';
  }

  submitExam() {
    const resultsData = this.questions.map(q => ({
      id: q.id,
      question_number: q.question_number,
      text: q.text,
      options: q.options,
      selectedOption: q.selectedOption,
      correctOption: q.correctOption,
      sectionId: q.sectionId,
      sectionName: q.sectionName,
      isCorrect: q.selectedOption === q.correctOption
    }));

    localStorage.setItem('examResults', JSON.stringify(resultsData));
    localStorage.setItem('examSections', JSON.stringify(this.sections));

    const token = localStorage.getItem('user_token');
    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Token ${token}`);
      const payload = {
        exam_id: this.examId,
        answers: this.questions.map(q => ({
          question_id: q.id,
          selected_option: q.selectedOption
        }))
      };

      this.http.post('http://127.0.0.1:8000/api/submit-exam/', payload, { headers }).subscribe({
        next: (res) => console.log('Exam saved to server:', res),
        error: (err) => console.error('Failed to save to server:', err)
      });
    }

    localStorage.removeItem('examEndTime');
    localStorage.removeItem(`exam_${this.examId}_answers`);
    localStorage.removeItem(`exam_${this.examId}_currentIndex`);

    this.router.navigate(['/score'], { replaceUrl: true });
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }
}
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface Section {
  id: number;
  name: string;
  part_number: number;
  startIndex: number;
  endIndex: number;
}

interface QuestionResult {
  id: number;
  question_number: number;
  text: string;
  options: string[];
  selectedOption: number | null;
  correctOption: number;
  sectionId: number | null;
  sectionName: string;
  isCorrect: boolean;
}

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './results.html',
  styleUrls: ['./results.css']
})
export class ResultsComponent implements OnInit, OnDestroy {
  questions: QuestionResult[] = [];
  sections: Section[] = [];
  currentQIndex: number = 0;
  currentSectionIndex: number = 0;
  totalQuestions: number = 0;
  correctCount: number = 0;
  wrongCount: number = 0;
  unansweredCount: number = 0;
  username: string = '';
  examName: string = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Prevent back navigation
    history.pushState(null, '', location.href);
    window.addEventListener('popstate', this.preventBack.bind(this));

    this.username = localStorage.getItem('username') || 'Candidate';
    this.examName = localStorage.getItem('selectedExamName') || 'Exam';
    
    // Get results from localStorage
    const resultsData = localStorage.getItem('examResults');
    const sectionsData = localStorage.getItem('examSections');
    
    if (!resultsData) {
      this.router.navigate(['/login']);
      return;
    }

    this.questions = JSON.parse(resultsData);
    this.sections = sectionsData ? JSON.parse(sectionsData) : this.buildSectionsFromQuestions();
    this.totalQuestions = this.questions.length;
    
    // Calculate stats
    this.questions.forEach(q => {
      if (q.selectedOption === null) {
        this.unansweredCount++;
      } else if (q.isCorrect) {
        this.correctCount++;
      } else {
        this.wrongCount++;
      }
    });
  }

  buildSectionsFromQuestions(): Section[] {
    const sectionMap = new Map<number, Section>();

    this.questions.forEach((q, index) => {
      const sectionId = q.sectionId || 0;
      if (!sectionMap.has(sectionId)) {
        sectionMap.set(sectionId, {
          id: sectionId,
          name: q.sectionName || 'General',
          part_number: sectionMap.size + 1,
          startIndex: index,
          endIndex: index
        });
      } else {
        const section = sectionMap.get(sectionId)!;
        section.endIndex = index;
      }
    });

    return Array.from(sectionMap.values());
  }

  jumpToQuestion(index: number) {
    this.currentQIndex = index;
    this.updateCurrentSection();
  }

  jumpToSection(sectionIndex: number) {
    const section = this.sections[sectionIndex];
    this.jumpToQuestion(section.startIndex);
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

  getSectionQuestions(section: Section): QuestionResult[] {
    return this.questions.slice(section.startIndex, section.endIndex + 1);
  }

  getCurrentSectionName(): string {
    if (this.sections.length > 0 && this.currentSectionIndex < this.sections.length) {
      return this.sections[this.currentSectionIndex].name;
    }
    return 'General Section';
  }

  getQuestionStatus(q: QuestionResult): string {
    if (q.selectedOption === null) return 'unanswered';
    return q.isCorrect ? 'correct' : 'wrong';
  }

  prevQuestion() {
    if (this.currentQIndex > 0) {
      this.currentQIndex--;
      this.updateCurrentSection();
    }
  }

  nextQuestion() {
    if (this.currentQIndex < this.questions.length - 1) {
      this.currentQIndex++;
      this.updateCurrentSection();
    }
  }

  preventBack(): void {
    history.pushState(null, '', location.href);
  }

  exitResults() {
    localStorage.removeItem('examResults');
    localStorage.removeItem('examSections');
    localStorage.removeItem('user_token');
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    window.removeEventListener('popstate', this.preventBack.bind(this));
  }
}

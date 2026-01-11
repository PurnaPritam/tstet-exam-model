import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

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

interface SectionScore {
  name: string;
  correct: number;
  wrong: number;
  unanswered: number;
  total: number;
}

@Component({
  selector: 'app-score-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './score-summary.html',
  styleUrls: ['./score-summary.css']
})
export class ScoreSummaryComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('overallPieCanvas') overallPieCanvas!: ElementRef<HTMLCanvasElement>;
  
  questions: QuestionResult[] = [];
  sectionScores: SectionScore[] = [];
  totalQuestions: number = 0;
  correctCount: number = 0;
  wrongCount: number = 0;
  unansweredCount: number = 0;
  percentage: number = 0;
  username: string = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    history.pushState(null, '', location.href);
    window.addEventListener('popstate', this.preventBack.bind(this));

    this.username = localStorage.getItem('username') || 'Candidate';
    
    const resultsData = localStorage.getItem('examResults');
    if (!resultsData) {
      this.router.navigate(['/login']);
      return;
    }

    this.questions = JSON.parse(resultsData);
    this.totalQuestions = this.questions.length;
    
    // Calculate overall and section-wise scores
    const sectionMap = new Map<string, SectionScore>();
    
    this.questions.forEach(q => {
      const sectionName = q.sectionName || 'General';
      
      if (!sectionMap.has(sectionName)) {
        sectionMap.set(sectionName, { name: sectionName, correct: 0, wrong: 0, unanswered: 0, total: 0 });
      }
      
      const section = sectionMap.get(sectionName)!;
      section.total++;
      
      if (q.selectedOption === null) {
        this.unansweredCount++;
        section.unanswered++;
      } else if (q.isCorrect) {
        this.correctCount++;
        section.correct++;
      } else {
        this.wrongCount++;
        section.wrong++;
      }
    });

    this.sectionScores = Array.from(sectionMap.values());
    this.percentage = Math.round((this.correctCount / this.totalQuestions) * 100);
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.drawOverallPieChart(), 100);
  }

  drawOverallPieChart(): void {
    if (!this.overallPieCanvas) return;
    const canvas = this.overallPieCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.drawPieChart(ctx, canvas.width, canvas.height, [
      { value: this.correctCount, color: '#28a745' },
      { value: this.wrongCount, color: '#dc3545' },
      { value: this.unansweredCount, color: '#6c757d' }
    ], this.percentage);
  }

  drawPieChart(ctx: CanvasRenderingContext2D, width: number, height: number, data: {value: number, color: string}[], centerText: number): void {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    const total = data.reduce((sum, d) => sum + d.value, 0);

    if (total === 0) return;

    let startAngle = -Math.PI / 2;

    data.forEach(segment => {
      if (segment.value === 0) return;
      const sliceAngle = (segment.value / total) * 2 * Math.PI;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = segment.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      startAngle += sliceAngle;
    });

    // Donut center
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.6, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();

    ctx.fillStyle = '#333';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${centerText}%`, centerX, centerY - 8);
    
    ctx.font = '12px Arial';
    ctx.fillStyle = '#666';
    ctx.fillText('Score', centerX, centerY + 15);
  }

  getSectionPercentage(section: SectionScore): number {
    return Math.round((section.correct / section.total) * 100);
  }

  preventBack(): void {
    history.pushState(null, '', location.href);
  }

  viewAnswers(): void {
    this.router.navigate(['/results']);
  }

  exitToLogin(): void {
    localStorage.removeItem('examResults');
    localStorage.removeItem('examSections');
    localStorage.removeItem('user_token');
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    window.removeEventListener('popstate', this.preventBack.bind(this));
  }
}

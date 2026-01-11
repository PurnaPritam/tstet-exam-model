import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

interface Exam {
  id: number;
  name: string;
  duration_minutes: number;
  attempted?: boolean;
  score?: number;
  total?: number;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  errorMessage = '';
  isLoading = false;
  
  // Exam selection
  showExamSelection = false;
  exams: Exam[] = [];
  selectedExamId: number | null = null;

  constructor(
    private http: HttpClient, 
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Only clear exam-related data, not the token
    localStorage.removeItem('examEndTime');
    localStorage.removeItem('selectedExamId');
    localStorage.removeItem('selectedExamName');
    localStorage.removeItem('examResults');
    localStorage.removeItem('examSections');
    
    // Clear token only if we're explicitly logging out
    // The token should persist for the session
    console.log('Session data cleared on login page init');
  }

  login() {
    this.isLoading = true;
    this.errorMessage = '';

    if (!this.username.trim() || !this.password.trim()) {
      this.errorMessage = 'Username and password are required';
      this.isLoading = false;
      return;
    }

    const payload = {
      username: this.username,
      password: this.password
    };

    this.http.post('http://127.0.0.1:8000/api-token-auth/', payload).subscribe({
      next: (response: any) => {
        if (!response.token) {
          this.errorMessage = 'No token received from server';
          this.isLoading = false;
          return;
        }
        localStorage.setItem('user_token', response.token);
        localStorage.setItem('username', this.username);
        this.fetchExams();
      },
      error: (error) => {
        this.isLoading = false;
        if (error.status === 0) {
          this.errorMessage = 'Cannot connect to server. Is Django running on port 8000?';
        } else if (error.status === 401) {
          this.errorMessage = 'Invalid username or password';
        } else {
          this.errorMessage = error.error?.error || 'Login failed';
        }
      }
    });
  }

  fetchExams() {
    const token = localStorage.getItem('user_token');
    
    if (!token) {
      this.errorMessage = 'Session error: No token found';
      this.isLoading = false;
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json'
    });

    // First fetch exams
    this.http.get<any>('http://127.0.0.1:8000/api/exams/', { headers }).subscribe({
      next: (response) => {
        let examsData = Array.isArray(response) ? response : response.results || response.data || [];
        
        if (!examsData || examsData.length === 0) {
          this.errorMessage = 'No exams available. Contact administrator.';
          this.isLoading = false;
          this.cdr.detectChanges();
          return;
        }
        
        // Fetch user attempts from backend
        this.http.get<any[]>('http://127.0.0.1:8000/api/user-attempts/', { headers }).subscribe({
          next: (attempts) => {
            // Mark exams as attempted based on backend data
            this.exams = examsData.map((exam: Exam) => {
              const attempt = attempts.find(a => a.exam_id === exam.id);
              if (attempt) {
                return {
                  ...exam,
                  attempted: true,
                  score: attempt.score,
                  total: attempt.total
                };
              }
              return { ...exam, attempted: false };
            });
            
            this.errorMessage = '';
            this.isLoading = false;
            this.showExamSelection = true;
            this.cdr.detectChanges();
          },
          error: () => {
            // If attempts fetch fails, just show exams without attempt info
            this.exams = examsData.map((exam: Exam) => ({ ...exam, attempted: false }));
            this.isLoading = false;
            this.showExamSelection = true;
            this.cdr.detectChanges();
          }
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load exams';
        this.cdr.detectChanges();
      }
    });
  }

  startExam() {
    if (!this.selectedExamId) {
      this.errorMessage = 'Please select an exam';
      return;
    }

    if (this.isSelectedExamAttempted()) {
      this.errorMessage = 'You have already attempted this exam';
      return;
    }

    // Save exam ID and name
    const selectedExam = this.exams.find(e => e.id === this.selectedExamId);
    localStorage.setItem('selectedExamId', this.selectedExamId.toString());
    localStorage.setItem('selectedExamName', selectedExam?.name || 'Exam');
    
    this.router.navigate(['/exam']);
  }

  isSelectedExamAttempted(): boolean {
    if (!this.selectedExamId) return false;
    const exam = this.exams.find(e => e.id === this.selectedExamId);
    return exam?.attempted || false;
  }
}
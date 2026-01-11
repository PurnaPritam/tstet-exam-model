import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { ExamInterfaceComponent } from './pages/exam-interface/exam-interface';
import { ResultsComponent } from './pages/results/results';
import { ScoreSummaryComponent } from './pages/score-summary/score-summary';
import { authGuard } from './auth-guard';

export const routes: Routes = [
    // 1. Default path redirects to Login
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    
    // 2. Login Page
    { path: 'login', component: LoginComponent },
    
    // 3. Exam Page (Protected by Guard)
    { 
      path: 'exam', 
      component: ExamInterfaceComponent,
      canActivate: [authGuard] 
    },
    {
      path: 'score',
      component: ScoreSummaryComponent
    },
    {
      path: 'results',
      component: ResultsComponent
    }
];
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // Check if the user has logged in (token exists)
  const token = localStorage.getItem('user_token');
  
  if (token) {
    return true; // Allow access
  } else {
    router.navigate(['/login']); // Kick them back to login
    return false;
  }
};
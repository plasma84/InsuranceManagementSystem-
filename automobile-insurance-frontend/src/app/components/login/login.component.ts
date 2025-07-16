import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

// Backend DTOs
interface LoginRequest {
  email: string;
  password: string;
  userType: string; // "USER", "OFFICER", "ADMIN"
}

interface JwtResponse {
  token: string;
  type: string;
  username: string;
  role: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  // Form fields matching backend LoginRequest exactly
  email = '';
  password = '';
  userType = 'USER'; // Default to USER
  
  loading = false;
  error = '';

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {}

  onSubmit() {
    console.log('🔑 Login attempt started');
    
    // Reset states
    this.error = '';
    this.loading = true;

    // Basic validation
    if (!this.email || !this.password) {
      this.error = 'Please enter both email and password.';
      this.loading = false;
      return;
    }

    // Create login request exactly as backend expects
    const loginRequest: LoginRequest = {
      email: this.email.trim().toLowerCase(),
      password: this.password,
      userType: this.userType
    };

    console.log('📤 Sending login request:', loginRequest);

    // Call backend login API directly
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    
    this.http.post<JwtResponse>('http://localhost:8888/api/auth/login', loginRequest, { headers })
      .subscribe({
        next: (response) => {
          console.log('✅ Login successful:', response);
          this.loading = false;
          
          // Store JWT token and user info
          localStorage.setItem('jwt_token', response.token);
          localStorage.setItem('user_email', response.username);
          localStorage.setItem('user_role', response.role);
          
          // Navigate to dashboard for all users
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          console.error('❌ Login failed:', error);
          this.loading = false;
          
          if (error.status === 400) {
            this.error = error.error || 'Invalid credentials. Please check your email and password.';
          } else if (error.status === 0) {
            this.error = 'Cannot connect to server. Please ensure backend is running on port 8888.';
          } else {
            this.error = 'Login failed. Please try again.';
          }
        }
      });
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }

  // Quick demo login functions
  quickLogin(userType: string) {
    if (userType === 'USER') {
      this.email = 'john.doe@example.com';
      this.password = 'TestPassword123!';
      this.userType = 'USER';
    } else if (userType === 'OFFICER') {
      this.email = 'officer1@insurance.com';
      this.password = 'OfficerSecure789!';
      this.userType = 'OFFICER';
    } else if (userType === 'ADMIN') {
      this.email = 'admin@insurance.com';
      this.password = 'AdminSecure321!';
      this.userType = 'ADMIN';
    }
    
    this.onSubmit();
  }

  // Test backend connection
  testBackendLogin() {
    const testLogin: LoginRequest = {
      email: 'john.doe@example.com',
      password: 'TestPassword123!',
      userType: 'USER'
    };
    
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    
    this.http.post<JwtResponse>('http://localhost:8888/api/auth/login', testLogin, { headers })
      .subscribe({
        next: (response) => {
          alert('✅ Backend login working! Token: ' + response.token.substring(0, 50) + '...');
        },
        error: (error) => {
          alert('❌ Backend login failed! Status: ' + error.status + ', Error: ' + error.error);
        }
      });
  }
}

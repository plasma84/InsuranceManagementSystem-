import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

// Backend User structure
interface BackendUser {
  name: string;
  email: string;
  password: string;
  address: string;
  dateOfBirth: string; // Will be converted to LocalDate by backend
  aadhaarNumber: string;
  panNumber: string;
  role?: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  // Form fields matching backend User entity exactly
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  address = '';
  dateOfBirth = '';
  aadhaarNumber = '';
  panNumber = '';
  
  loading = false;
  error = '';
  success = false;

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {}

  onSubmit() {
    console.log('🚀 Registration started - Form submitted!');
    
    // Reset states
    this.error = '';
    this.loading = true;

    // Comprehensive validation
    if (!this.name || !this.email || !this.password || !this.confirmPassword ||
        !this.address || !this.dateOfBirth || !this.aadhaarNumber || !this.panNumber) {
      this.error = 'Please fill in all required fields.';
      this.loading = false;
      console.log('❌ Validation failed: Missing required fields');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match.';
      this.loading = false;
      console.log('❌ Validation failed: Password mismatch');
      return;
    }

    if (!this.email.includes('@') || !this.email.includes('.')) {
      this.error = 'Please enter a valid email address.';
      this.loading = false;
      console.log('❌ Validation failed: Invalid email format');
      return;
    }

    if (this.password.length < 6) {
      this.error = 'Password must be at least 6 characters long.';
      this.loading = false;
      console.log('❌ Validation failed: Password too short');
      return;
    }

    console.log('✅ All validation passed');

    // Create user object exactly as backend expects
    const user: BackendUser = {
      name: this.name.trim(),
      email: this.email.trim().toLowerCase(),
      password: this.password,
      address: this.address.trim(),
      dateOfBirth: this.dateOfBirth,
      aadhaarNumber: this.aadhaarNumber.replace(/\s/g, ''),
      panNumber: this.panNumber.toUpperCase().trim()
    };

    console.log('📤 Sending to backend:', user);

    // Call backend registration API directly
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    
    this.http.post('http://localhost:8888/api/auth/register/user', user, { 
      headers, 
      responseType: 'text' // Backend returns plain text "User registered successfully"
    }).subscribe({
      next: (response) => {
        console.log('✅ Registration successful:', response);
        this.loading = false;
        this.success = true;
        
        // Clear form
        this.name = '';
        this.email = '';
        this.password = '';
        this.confirmPassword = '';
        this.address = '';
        this.dateOfBirth = '';
        this.aadhaarNumber = '';
        this.panNumber = '';
        
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        console.error('❌ Registration failed:', error);
        this.loading = false;
        
        if (error.status === 400) {
          this.error = error.error || 'Registration failed. Email may already exist. Please try a different email.';
        } else if (error.status === 0) {
          this.error = 'Cannot connect to server. Please ensure backend is running on port 8888.';
        } else {
          this.error = `Registration failed (Status: ${error.status}). Please try again.`;
        }
      }
    });
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  // Fill form with test data for quick testing
  fillTestData() {
    const timestamp = Date.now();
    this.name = 'Test User';
    this.email = `testuser${timestamp}@example.com`;
    this.password = '123456';
    this.confirmPassword = '123456';
    this.address = '123 Test Street, Test City';
    this.dateOfBirth = '1990-01-01';
    this.aadhaarNumber = '123456789012';
    this.panNumber = 'ABCDE1234F';
    
    console.log('✅ Test data filled with unique email:', this.email);
  }

  // Test with backend API directly
  testBackendConnection() {
    console.log('🧪 Testing backend connection...');
    
    const testUser: BackendUser = {
      name: "Test User",
      email: "test" + Date.now() + "@example.com",
      password: "123456",
      address: "Test Address",
      dateOfBirth: "1990-01-01",
      aadhaarNumber: "123456789012",
      panNumber: "ABCDE1234F"
    };
    
    console.log('📤 Test payload:', testUser);
    
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    
    this.http.post('http://localhost:8888/api/auth/register/user', testUser, { 
      headers, 
      responseType: 'text' 
    }).subscribe({
      next: (response) => {
        console.log('✅ Backend test successful:', response);
        alert('✅ Backend connection working! Response: ' + response);
      },
      error: (error) => {
        console.error('❌ Backend test failed:', error);
        alert('❌ Backend connection failed! Status: ' + error.status + ', Error: ' + JSON.stringify(error.error));
      }
    });
  }
}

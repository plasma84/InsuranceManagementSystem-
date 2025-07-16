import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

export interface LoginRequest {
  email: string;
  password: string;
  userType: 'USER' | 'OFFICER' | 'ADMIN';
}

export interface JwtResponse {
  token: string;
  email: string;
  role: string;
}

export interface User {
  id?: number;
  name: string;
  email: string;
  password?: string;
  address: string;
  dateOfBirth: string;
  aadhaarNumber: string;
  panNumber: string;
  role?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:8888/api';
  private readonly tokenSubject = new BehaviorSubject<string | null>(null);
  private readonly userSubject = new BehaviorSubject<any>(null);

  public token$ = this.tokenSubject.asObservable();
  public user$ = this.userSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private readonly platformId: Object, private readonly http: HttpClient) {
    // Check for existing token on service initialization (only in browser)
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('jwt_token');
      if (token) {
        this.tokenSubject.next(token);
        this.validateToken().subscribe();
      }
    }
  }

  login(credentials: LoginRequest): Observable<JwtResponse> {
    return this.http.post<JwtResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('jwt_token', response.token);
            localStorage.setItem('user_email', response.email);
            localStorage.setItem('user_role', response.role);
          }
          this.tokenSubject.next(response.token);
          this.userSubject.next({
            email: response.email,
            role: response.role
          });
        })
      );
  }

  register(user: User): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    console.log('🌐 Making POST request to:', `${this.apiUrl}/auth/register/user`);
    console.log('📦 Request body:', JSON.stringify(user));
    console.log('📋 Request headers:', headers);
    
    // The backend returns plain text, not JSON, so we need to specify responseType
    return this.http.post(`${this.apiUrl}/auth/register/user`, user, { 
      headers,
      responseType: 'text' // This tells Angular to expect text, not JSON
    });
  }

  validateToken(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/validate`, {
      headers: this.getAuthHeaders()
    });
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_role');
    }
    this.tokenSubject.next(null);
    this.userSubject.next(null);
  }

  isAuthenticated(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!localStorage.getItem('jwt_token');
    }
    return false;
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('jwt_token');
    }
    return null;
  }

  getUserRole(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('user_role');
    }
    return null;
  }

  getUserEmail(): string | null {
    const email = isPlatformBrowser(this.platformId) ? localStorage.getItem('user_email') : null;
    console.log('AuthService.getUserEmail() called, returning:', email);
    return email;
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    console.log('AuthService.getAuthHeaders() called, token exists:', !!token);
    console.log('Token preview:', token ? token.substring(0, 50) + '...' : 'null');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  hasRole(role: string): boolean {
    const userRole = this.getUserRole();
    if (role === 'USER') {
      return userRole === 'USER' || userRole === 'OFFICER' || userRole === 'ADMIN';
    }
    if (role === 'OFFICER') {
      return userRole === 'OFFICER' || userRole === 'ADMIN';
    }
    if (role === 'ADMIN') {
      return userRole === 'ADMIN';
    }
    return false;
  }
  
  // Method to test authentication and get detailed error info
  public testAuthentication(): Observable<any> {
    console.log('🔍 Testing authentication...');
    console.log('Token exists:', !!this.getToken());
    console.log('Is authenticated:', this.isAuthenticated());
    console.log('User email:', this.getUserEmail());
    console.log('User role:', this.getUserRole());
    
    return this.http.get(`${this.apiUrl}/user`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap({
        next: (response) => {
          console.log('✅ Authentication test successful:', response);
        },
        error: (error) => {
          console.error('❌ Authentication test failed:', error);
          console.log('Error details:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            headers: error.headers
          });
          
          if (error.status === 403) {
            console.log('🔧 403 Forbidden - Token may be expired or invalid');
            console.log('Current token:', this.getToken());
          }
        }
      })
    );
  }
  
  // Method to force re-login if token is invalid
  public forceReLogin(): void {
    console.log('🔄 Forcing re-login due to authentication issues...');
    this.logout();
    // Clear all stored data
    if (isPlatformBrowser(this.platformId)) {
      localStorage.clear();
      sessionStorage.clear();
    }
    console.log('✅ Cleared all auth data. Please login again.');
  }
  
  // Method to refresh/validate current session
  public refreshSession(): Observable<any> {
    console.log('🔄 Attempting to refresh session...');
    
    if (!this.isAuthenticated()) {
      console.log('❌ No valid session to refresh');
      throw new Error('No valid session');
    }
    
    return this.validateToken().pipe(
      tap({
        next: (response) => {
          console.log('✅ Session refresh successful:', response);
        },
        error: (error) => {
          console.error('❌ Session refresh failed:', error);
          console.log('🔧 Forcing logout due to invalid session');
          this.forceReLogin();
        }
      })
    );
  }
}

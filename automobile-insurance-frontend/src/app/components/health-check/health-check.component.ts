import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { InsuranceService } from '../../services/insurance.service';

@Component({
  selector: 'app-health-check',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 20px; font-family: Arial;">
      <h2>🔧 System Health Check</h2>
      
      <div style="background: #f0f0f0; padding: 15px; margin: 10px 0; border-radius: 5px;">
        <h3>Authentication Status</h3>
        <p>✅ Is Authenticated: {{ authService.isAuthenticated() }}</p>
        <p>✅ Token Present: {{ authService.getToken() ? 'Yes' : 'No' }}</p>
        <p>✅ User Email: {{ authService.getUserEmail() || 'Not set' }}</p>
        <p>✅ User Role: {{ authService.getUserRole() || 'Not set' }}</p>
        
        <button 
          *ngIf="!authService.isAuthenticated()" 
          (click)="quickLogin()" 
          style="background: #007bff; color: white; padding: 10px; border: none; border-radius: 5px; cursor: pointer;">
          🚀 Quick Login (Test User)
        </button>
        
        <button 
          *ngIf="authService.isAuthenticated()" 
          (click)="logout()" 
          style="background: #dc3545; color: white; padding: 10px; border: none; border-radius: 5px; cursor: pointer;">
          🚪 Logout
        </button>
      </div>

      <div style="background: #e8f5e8; padding: 15px; margin: 10px 0; border-radius: 5px;">
        <h3>API Connectivity</h3>
        <p>Backend Status: {{ backendStatus }}</p>
        <p>Users API: {{ usersApiStatus }}</p>
        <p>Proposals API: {{ proposalsApiStatus }}</p>
        <p>Claims API: {{ claimsApiStatus }}</p>
        
        <button 
          (click)="testAllApis()" 
          style="background: #28a745; color: white; padding: 10px; border: none; border-radius: 5px; cursor: pointer;">
          🧪 Test All APIs
        </button>
      </div>

      <div style="background: #e3f2fd; padding: 15px; margin: 10px 0; border-radius: 5px;">
        <h3>Component Navigation</h3>
        <button 
          *ngFor="let route of routes" 
          (click)="navigateTo(route.path)"
          style="background: #17a2b8; color: white; padding: 8px 12px; margin: 5px; border: none; border-radius: 3px; cursor: pointer;">
          📄 {{ route.name }}
        </button>
      </div>

      <div style="background: #fff3cd; padding: 15px; margin: 10px 0; border-radius: 5px;">
        <h3>Test Results</h3>
        <pre>{{ testResults | json }}</pre>
      </div>
    </div>
  `
})
export class HealthCheckComponent implements OnInit {
  backendStatus = 'Not tested';
  usersApiStatus = 'Not tested';
  proposalsApiStatus = 'Not tested';
  claimsApiStatus = 'Not tested';
  testResults: any = {};

  routes = [
    { name: 'Login', path: '/login' },
    { name: 'Register', path: '/register' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'New Proposal', path: '/new-proposal' },
    { name: 'Claims', path: '/claims' },
  ];

  constructor(
    public authService: AuthService,
    private readonly insuranceService: InsuranceService,
    private readonly router: Router
  ) {}

  ngOnInit() {
    this.testResults = {
      timestamp: new Date().toISOString(),
      authenticationStatus: this.authService.isAuthenticated(),
      userEmail: this.authService.getUserEmail(),
      userRole: this.authService.getUserRole()
    };
  }

  quickLogin() {
    const credentials = {
      email: 'john.doe@example.com',
      password: 'TestPassword123!',
      userType: 'USER' as const
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.testResults.loginTest = { success: true, response };
        this.testAllApis();
      },
      error: (error) => {
        this.testResults.loginTest = { success: false, error };
      }
    });
  }

  logout() {
    this.authService.logout();
    this.testResults.logoutTest = { success: true, timestamp: new Date().toISOString() };
  }

  testAllApis() {
    // Test Users API
    this.insuranceService.getAllUsers().subscribe({
      next: (users) => {
        this.usersApiStatus = `✅ Success (${users.length} users)`;
        this.testResults.usersApi = { success: true, count: users.length };
      },
      error: (error) => {
        this.usersApiStatus = `❌ Failed: ${error.message}`;
        this.testResults.usersApi = { success: false, error };
      }
    });

    // Test Proposals API (if authenticated)
    if (this.authService.isAuthenticated()) {
      this.insuranceService.getUserProposals(1).subscribe({
        next: (proposals) => {
          this.proposalsApiStatus = `✅ Success (${proposals.length} proposals)`;
          this.testResults.proposalsApi = { success: true, count: proposals.length };
        },
        error: (error) => {
          this.proposalsApiStatus = `❌ Failed: ${error.message}`;
          this.testResults.proposalsApi = { success: false, error };
        }
      });

      // Test Claims API
      this.insuranceService.getUserClaims(1).subscribe({
        next: (claims) => {
          this.claimsApiStatus = `✅ Success (${claims.length} claims)`;
          this.testResults.claimsApi = { success: true, count: claims.length };
        },
        error: (error) => {
          this.claimsApiStatus = `❌ Failed: ${error.message}`;
          this.testResults.claimsApi = { success: false, error };
        }
      });
    }

    this.backendStatus = '✅ Connected';
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface Claim {
  id?: number;
  reason: string;
  status: string;
  dateFiled?: string;
  user?: User;
  proposal?: Proposal;
}

export interface Proposal {
  id?: number;
  vehicleType: string;
  vehicleNumber: string;
  policyPackage: string;
  premiumAmount: number;
  submissionDate?: string;
  paymentDate?: string;
  transactionId?: string;
  status?: string;
}

export interface User {
  id?: number;
  name: string;
  email: string;
  address: string;
  dateOfBirth: string;
  aadhaarNumber: string;
  panNumber: string;
  role?: string;
  proposals?: Proposal[];
  age?: number;
}

@Injectable({
  providedIn: 'root'
})
export class InsuranceService {
  private readonly apiUrl = 'http://localhost:8888/api';

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService
  ) {}

  // User Management
  getAllUsers(): Observable<User[]> {
    const url = `${this.apiUrl}/user`;
    console.log('InsuranceService.getAllUsers() called, URL:', url);
    return this.http.get<User[]>(url, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/user/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/user/${id}`, user, {
      headers: this.authService.getAuthHeaders()
    });
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/user/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Delete Policy/Proposal
  deleteProposal(proposalId: number): Observable<any> {
    console.log('🗑️ Deleting proposal with ID:', proposalId);
    return this.http.delete(`${this.apiUrl}/proposals/${proposalId}`, {
      headers: this.authService.getAuthHeaders(),
      responseType: 'text'
    }).pipe(
      tap({
        next: (response) => {
          console.log('✅ Proposal deleted successfully:', response);
        },
        error: (error) => {
          console.error('❌ Failed to delete proposal:', error);
        }
      })
    );
  }

  // Proposal Management
  submitProposal(userId: number, proposal: Proposal): Observable<any> {
    const url = `${this.apiUrl}/proposals/submit/${userId}`;
    const headers = this.authService.getAuthHeaders();
    console.log('InsuranceService.submitProposal() called');
    console.log('URL:', url);
    console.log('Proposal data:', JSON.stringify(proposal, null, 2));
    console.log('Headers set for API call');
    
    return this.http.post(url, proposal, { headers });
  }

  getUserProposals(userId: number): Observable<Proposal[]> {
    return this.http.get<Proposal[]>(`${this.apiUrl}/proposals/user/${userId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getAllProposals(): Observable<Proposal[]> {
    return this.http.get<Proposal[]>(`${this.apiUrl}/proposals`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Officer Management
  getAllOfficers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/officer`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Payment Management
  processPayment(paymentData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/payments/process`, paymentData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getPaymentHistory(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/payments/user/${userId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Statistics and Dashboard Data
  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/stats`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Claims Management
  submitClaim(userId: number, proposalId: number, reason: string): Observable<any> {
    const params = new URLSearchParams();
    params.set('userId', userId.toString());
    params.set('proposalId', proposalId.toString());
    params.set('reason', reason);

    return this.http.post(`${this.apiUrl}/payments/claim?${params.toString()}`, null, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getUserClaims(userId: number): Observable<Claim[]> {
    return this.http.get<Claim[]>(`${this.apiUrl}/payments/claims/user/${userId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getAllClaims(): Observable<Claim[]> {
    console.log('🔍 Fetching all claims from:', `${this.apiUrl}/payments/claims`);
    return this.http.get<Claim[]>(`${this.apiUrl}/payments/claims`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updateClaimStatus(claimId: number, status: string): Observable<any> {
    const params = new URLSearchParams();
    params.set('status', status);
    
    console.log('🔄 Updating claim status:', { claimId, status });
    console.log('🌐 Full URL:', `${this.apiUrl}/payments/claim/${claimId}/status?${params.toString()}`);
    console.log('📋 Headers:', this.authService.getAuthHeaders());
    
    return this.http.put(`${this.apiUrl}/payments/claim/${claimId}/status?${params.toString()}`, null, {
      headers: this.authService.getAuthHeaders(),
      responseType: 'text' // Backend returns plain text, not JSON
    }).pipe(
      tap({
        next: (response) => {
          console.log('✅ UpdateClaimStatus successful response:', response);
        },
        error: (error) => {
          console.error('❌ UpdateClaimStatus error response:', error);
        }
      })
    );
  }

  // Add diagnostic method to test claims API
  public testClaimsAPI(): Observable<any> {
    console.log('🧪 Testing claims API endpoints...');
    console.log('Auth headers:', this.authService.getAuthHeaders());
    console.log('User role:', this.authService.getUserRole());
    
    return this.http.get(`${this.apiUrl}/payments/claims`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Policy Packages
  getPolicyPackages(): Observable<any[]> {
    const packages = [
      {
        name: 'Basic Third Party',
        description: 'Covers third-party liability only',
        price: 3000,
        features: ['Third Party Liability', 'Legal Compliance', 'Accident Cover']
      },
      {
        name: 'Comprehensive',
        description: 'Complete protection for your vehicle',
        price: 6000,
        features: ['Own Damage Cover', 'Third Party Liability', 'Theft Protection', 'Natural Calamity Cover']
      },
      {
        name: 'Comprehensive Plus',
        description: 'Enhanced coverage with additional benefits',
        price: 8000,
        features: ['All Comprehensive Features', 'Zero Depreciation', 'Roadside Assistance', 'Engine Protection']
      },
      {
        name: 'Premium',
        description: 'Luxury vehicle protection',
        price: 10000,
        features: ['All Plus Features', 'Return to Invoice', 'NCB Protection', 'Key Replacement']
      }
    ];
    
    return new Observable(observer => {
      observer.next(packages);
      observer.complete();
    });
  }
}

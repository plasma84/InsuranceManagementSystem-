import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { InsuranceService, Claim, Proposal } from '../../services/insurance.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-claims',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './claims.component.html',
  styleUrls: ['./claims.component.scss']
})
export class ClaimsComponent implements OnInit {
  claimForm: FormGroup;
  claims: Claim[] = [];
  allClaims: Claim[] = []; // For officer/admin view
  userProposals: Proposal[] = [];
  loading = false;
  activeTab = 'submit'; // 'submit', 'view', or 'manage'
  submitMessage = '';
  currentUser: any = null;

  // Check if current user is officer or admin
  get isOfficerOrAdmin(): boolean {
    const role = this.authService.getUserRole();
    return role === 'OFFICER' || role === 'ADMIN';
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly insuranceService: InsuranceService,
    public readonly authService: AuthService, // Make public for template access
    private readonly router: Router
  ) {
    this.claimForm = this.fb.group({
      proposalId: ['', Validators.required],
      reason: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    // Check if user is authenticated, if not redirect to login
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    // Set up user and load data
    this.setupUserAndLoadData();
  }

  setupUserAndLoadData(): void {
    console.log('=== DEBUGGING AUTHENTICATION ===');
    console.log('Is authenticated:', this.authService.isAuthenticated());
    console.log('Token:', this.authService.getToken());
    console.log('User email:', this.authService.getUserEmail());
    console.log('User role:', this.authService.getUserRole());
    
    const userEmail = this.authService.getUserEmail();
    
    if (!userEmail) {
      console.log('No user email found - user not authenticated');
      this.currentUser = null;
      this.userProposals = [];
      this.claims = [];
      return;
    }

    console.log('Current user email from auth service:', userEmail);

    // Create a simple user object for now if we have email
    this.currentUser = {
      id: 1, // Default to user ID 1 for now - we'll get the real ID from the API
      email: userEmail,
      name: userEmail.split('@')[0],
      address: '',
      dateOfBirth: '',
      aadhaarNumber: '',
      panNumber: ''
    };

    console.log('Current user object created:', this.currentUser);

    // Load data with fallback
    this.loadData();
  }

  loadData(): void {
    // Load user proposals
    this.loadUserProposals();
    
    // Load user claims
    this.loadUserClaims();
    
    // Load all claims if officer/admin
    if (this.isOfficerOrAdmin) {
      this.loadAllClaims();
    }
  }

  loadUserProposals(): void {
    if (!this.currentUser?.id) {
      console.warn('No user ID available for loading proposals');
      return;
    }

    console.log('Loading proposals for user ID:', this.currentUser.id);
    console.log('Auth token:', this.authService.getToken());
    console.log('API URL will be:', `http://localhost:8888/api/proposals/user/${this.currentUser.id}`);
    
    this.loading = true;
    this.insuranceService.getUserProposals(this.currentUser.id).subscribe({
      next: (proposals) => {
        console.log('Proposals loaded successfully:', proposals);
        this.userProposals = proposals || []; // Ensure it's always an array
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading proposals:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });
        this.userProposals = []; // Set empty array on error
        this.loading = false;
      }
    });
  }

  loadUserClaims(): void {
    if (!this.currentUser?.id) {
      console.warn('No user ID available for loading claims');
      return;
    }

    this.loading = true;
    this.insuranceService.getUserClaims(this.currentUser.id).subscribe({
      next: (claims) => {
        this.claims = claims;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading claims:', error);
        this.claims = []; // Set empty array on error
        this.loading = false;
      }
    });
  }

  loadAllClaims(): void {
    console.log('Loading all claims...');
    this.loading = true;
    this.insuranceService.getAllClaims().subscribe({
      next: (claims) => {
        this.allClaims = claims;
        console.log('All claims loaded successfully:', claims);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading all claims:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message,
          error: error.error
        });
        this.allClaims = [];
        this.loading = false;
        this.submitMessage = 'Error loading claims. Please try again.';
        
        // Clear error message after 5 seconds
        setTimeout(() => {
          this.submitMessage = '';
        }, 5000);
      }
    });
  }
  
  // Add diagnostic method
  debugClaims(): void {
    console.log('🔍 Debugging claims system...');
    console.log('User role:', this.authService.getUserRole());
    console.log('Is Officer/Admin:', this.isOfficerOrAdmin);
    console.log('Current user:', this.currentUser);
    console.log('Auth token exists:', !!this.authService.getToken());
    
    // Test authentication first
    this.authService.testAuthentication().subscribe({
      next: (authResult) => {
        console.log('✅ Authentication test passed:', authResult);
        
        // Test claims API
        this.insuranceService.testClaimsAPI().subscribe({
          next: (claimsResult) => {
            console.log('✅ Claims API test passed:', claimsResult);
            console.log('📊 Claims data:', claimsResult);
            
            if (!claimsResult || claimsResult.length === 0) {
              console.log('⚠️ No claims found in database');
              this.submitMessage = 'No claims found in database. You may need to create some claims first.';
            } else {
              console.log(`✅ Found ${claimsResult.length} claims in database`);
              this.allClaims = claimsResult;
              this.submitMessage = `Successfully loaded ${claimsResult.length} claims!`;
            }
          },
          error: (claimsError) => {
            console.error('❌ Claims API test failed:', claimsError);
            if (claimsError.status === 403) {
              this.submitMessage = 'Access denied. Please login with OFFICER or ADMIN role.';
            } else {
              this.submitMessage = `Claims API error: ${claimsError.status} - ${claimsError.statusText}`;
            }
          }
        });
      },
      error: (authError) => {
        console.error('❌ Authentication test failed:', authError);
        this.submitMessage = 'Authentication failed. Please login again.';
        
        // Force re-login if authentication fails
        if (authError.status === 403 || authError.status === 401) {
          this.authService.forceReLogin();
          this.router.navigate(['/login']);
        }
      }
    });
    
    // Clear message after 10 seconds
    setTimeout(() => {
      this.submitMessage = '';
    }, 10000);
  }
  
  // Quick officer login for testing
  quickOfficerLogin(): void {
    console.log('🚀 Quick officer login...');
    this.authService.logout();
    
    const credentials = {
      email: 'officer1@insurance.com',
      password: 'OfficerSecure789!',
      userType: 'OFFICER' as const
    };
    
    this.authService.login(credentials).subscribe({
      next: (response) => {
        console.log('✅ Officer login successful:', response);
        this.submitMessage = 'Officer login successful! Refreshing claims...';
        this.currentUser = { email: response.email, role: response.role };
        
        // Reload claims after successful login
        setTimeout(() => {
          this.loadAllClaims();
        }, 1000);
      },
      error: (error) => {
        console.error('❌ Officer login failed:', error);
        this.submitMessage = 'Officer login failed. Please check credentials.';
      }
    });
  }
  
  // Emergency method to stop infinite loading
  stopLoading(): void {
    console.log('🛑 Manually stopping loading state...');
    this.loading = false;
    this.submitMessage = 'Loading stopped manually.';
    
    setTimeout(() => {
      this.submitMessage = '';
    }, 3000);
  }
  
  // Method to force refresh all claims with proper error handling
  forceRefreshClaims(): void {
    console.log('🔄 Force refreshing all claims...');
    this.loading = true;
    this.submitMessage = 'Refreshing claims...';
    
    this.insuranceService.getAllClaims().subscribe({
      next: (claims) => {
        console.log('✅ Force refresh successful:', claims);
        this.allClaims = claims;
        this.loading = false;
        this.submitMessage = `Successfully refreshed ${claims.length} claims!`;
        
        setTimeout(() => {
          this.submitMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('❌ Force refresh failed:', error);
        this.loading = false;
        this.submitMessage = 'Failed to refresh claims. Please check your connection and authentication.';
        
        setTimeout(() => {
          this.submitMessage = '';
        }, 5000);
      }
    });
  }
  
  // Test method with minimal logic for troubleshooting
  testApprove(claimId: number): void {
    console.log('🧪 TEST APPROVE - Starting...');
    
    // Manual HTTP call for testing
    const headers = this.authService.getAuthHeaders();
    const url = `http://localhost:8888/api/payments/claim/${claimId}/status?status=APPROVED`;
    
    console.log('🧪 TEST URL:', url);
    console.log('🧪 TEST Headers:', headers);
    
    fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': headers.get('Authorization') || '',
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      console.log('🧪 TEST Response status:', response.status);
      return response.text();
    })
    .then(data => {
      console.log('🧪 TEST Response data:', data);
      this.submitMessage = 'Test approve completed - check console!';
      setTimeout(() => this.submitMessage = '', 3000);
    })
    .catch(error => {
      console.error('🧪 TEST Error:', error);
      this.submitMessage = 'Test approve failed - check console!';
      setTimeout(() => this.submitMessage = '', 3000);
    });
  }
  
  onSubmitClaim(): void {
    if (this.claimForm.valid && this.currentUser?.id) {
      this.loading = true;
      const formData = this.claimForm.value;
      
      this.insuranceService.submitClaim(
        this.currentUser.id,
        formData.proposalId,
        formData.reason
      ).subscribe({
        next: (response) => {
          this.submitMessage = 'Claim submitted successfully!';
          this.claimForm.reset();
          this.loadUserClaims(); // Refresh claims list
          this.loading = false;
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            this.submitMessage = '';
          }, 3000);
        },
        error: (error) => {
          console.error('Error submitting claim:', error);
          this.submitMessage = 'Error submitting claim. Please try again.';
          this.loading = false;
          
          // Clear error message after 5 seconds
          setTimeout(() => {
            this.submitMessage = '';
          }, 5000);
        }
      });
    } else {
      this.submitMessage = 'Please fill in all required fields and ensure you are logged in.';
      setTimeout(() => {
        this.submitMessage = '';
      }, 3000);
    }
  }

  updateClaimStatus(claimId: number, status: 'APPROVED' | 'REJECTED'): void {
    console.log(`🔄 STARTING claim update: ID=${claimId}, Status=${status}`);
    console.log(`🔄 Current loading state: ${this.loading}`);
    
    // Set loading immediately
    this.loading = true;
    console.log(`🔄 Set loading to true`);
    
    // Add a timeout as safety net
    const timeoutId = setTimeout(() => {
      console.log('⚠️ TIMEOUT: Force stopping loading after 10 seconds');
      this.loading = false;
      this.submitMessage = 'Request timed out. Please try again.';
    }, 10000);
    
    this.insuranceService.updateClaimStatus(claimId, status).subscribe({
      next: (response: any) => {
        console.log('✅ RESPONSE RECEIVED:', response);
        clearTimeout(timeoutId);
        
        this.loading = false;
        console.log('✅ Set loading to false (success)');
        
        this.submitMessage = `Claim ${status.toLowerCase()} successfully!`;
        console.log('✅ Success message set');
        
        // Simple reload without complex logic
        this.simpleReloadClaims();
        
        // Clear message after 3 seconds
        setTimeout(() => {
          this.submitMessage = '';
        }, 3000);
      },
      error: (error: any) => {
        console.error('❌ ERROR RECEIVED:', error);
        clearTimeout(timeoutId);
        
        this.loading = false;
        console.log('❌ Set loading to false (error)');
        
        this.submitMessage = `Error ${status.toLowerCase()} claim: ${error.status || 'Unknown error'}`;
        console.log('❌ Error message set');
        
        setTimeout(() => {
          this.submitMessage = '';
        }, 5000);
      }
    });
    
    console.log(`🔄 Subscription created, waiting for response...`);
  }
  
  // Simple method to reload claims without complex state management
  simpleReloadClaims(): void {
    console.log('🔄 Simple reload claims...');
    
    this.insuranceService.getAllClaims().subscribe({
      next: (claims: any) => {
        console.log('✅ Simple reload successful:', claims?.length || 0, 'claims');
        this.allClaims = claims || [];
      },
      error: (error: any) => {
        console.error('❌ Simple reload failed:', error);
        // Don't change loading state here, just log the error
      }
    });
  }

  // Temporary method to test claim approval without role restrictions (for debugging)
  debugUpdateClaimStatus(claimId: number, status: 'APPROVED' | 'REJECTED'): void {
    console.log(`🔧 DEBUG: Attempting to update claim ${claimId} to ${status}`);
    console.log(`🔧 DEBUG: Current user role: ${this.authService.getUserRole()}`);
    console.log(`🔧 DEBUG: Is Officer/Admin: ${this.isOfficerOrAdmin}`);
    
    // Show confirmation dialog
    const confirmAction = confirm(`Are you sure you want to ${status.toLowerCase()} claim ${claimId}?`);
    if (!confirmAction) {
      return;
    }
    
    this.updateClaimStatus(claimId, status);
  }
  
  // Method to check claim status debug info
  debugClaimStatus(claim: Claim): void {
    console.log('🔍 CLAIM DEBUG INFO:', {
      claimId: claim.id,
      status: claim.status,
      statusDisplay: this.getStatusDisplay(claim.status),
      isPending: claim.status === 'PENDING',
      canShowButtons: claim.status === 'PENDING',
      currentUserRole: this.authService.getUserRole(),
      isOfficerOrAdmin: this.isOfficerOrAdmin
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.submitMessage = '';
  }

  getProposalDetails(proposalId: number): Proposal | undefined {
    return this.userProposals.find(p => p.id === proposalId);
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'status-pending';
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-unknown';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  quickLogin(): void {
    const credentials = {
      email: 'john.doe@example.com',
      password: 'TestPassword123!',
      userType: 'USER' as 'USER' | 'OFFICER' | 'ADMIN'
    };

    this.loading = true;
    this.authService.login(credentials).subscribe({
      next: (response) => {
        console.log('Quick login successful:', response);
        this.loading = false;
        // Reload data after successful login
        this.setupUserAndLoadData();
      },
      error: (error) => {
        console.error('Quick login failed:', error);
        this.loading = false;
        this.submitMessage = 'Login failed. Please try again.';
        setTimeout(() => {
          this.submitMessage = '';
        }, 3000);
      }
    });
  }

  navigateToNewProposal(): void {
    this.router.navigate(['/new-proposal']);
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  getStatusDisplay(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'Pending Review';
      case 'APPROVED':
        return 'Approved';
      case 'REJECTED':
        return 'Rejected';
      case 'UNDER_REVIEW':
        return 'Under Review';
      default:
        return status || 'Unknown';
    }
  }

  viewClaimDetails(claim: Claim): void {
    // For now, we'll just show an alert with claim details
    // In a real application, this would open a modal or navigate to a details page
    alert(`Claim Details:\n\nID: ${claim.id}\nStatus: ${claim.status}\nDate Filed: ${this.formatDate(claim.dateFiled || '')}\nReason: ${claim.reason}`);
  }

  // Method to create test claims for demonstration
  createTestClaims(): void {
    console.log('🧪 Creating test claims for demonstration...');
    
    const testClaims = [
      {
        proposalId: 1,
        reason: 'Vehicle accident on highway - front bumper damage requires repair and replacement'
      },
      {
        proposalId: 2, 
        reason: 'Theft of vehicle parts - side mirrors and stereo system stolen from parking lot'
      },
      {
        proposalId: 3,
        reason: 'Natural disaster damage - hail storm caused dents on roof and hood of vehicle'
      }
    ];

    let claimsCreated = 0;
    const totalClaims = testClaims.length;

    testClaims.forEach((testClaim, index) => {
      // Create claim using the existing submitClaim method logic
      this.loading = true;
      
      // Use currentUser ID or fallback to 1 for testing
      const userId = this.currentUser?.id || 1;
      
      this.insuranceService.submitClaim(userId, testClaim.proposalId, testClaim.reason).subscribe({
        next: (response) => {
          claimsCreated++;
          console.log(`✅ Test claim ${index + 1} created:`, response);
          
          if (claimsCreated === totalClaims) {
            console.log('🎉 All test claims created successfully!');
            this.submitMessage = `${totalClaims} test claims created successfully! Refresh to see them.`;
            
            // Reload claims to show the new ones
            setTimeout(() => {
              this.loadAllClaims();
              this.loadUserClaims();
            }, 1000);
            
            // Clear message after 5 seconds
            setTimeout(() => {
              this.submitMessage = '';
            }, 5000);
          }
        },
        error: (error) => {
          console.error(`❌ Failed to create test claim ${index + 1}:`, error);
          claimsCreated++; // Count failed attempts too
          
          if (claimsCreated === totalClaims) {
            this.loading = false;
            this.submitMessage = 'Some test claims failed to create. Check console for details.';
            
            setTimeout(() => {
              this.submitMessage = '';
            }, 5000);
          }
        }
      });
    });
  }

  // Method to check if we have proposals to create claims against
  checkProposalsForClaims(): void {
    console.log('🔍 Checking available proposals for claims...');
    
    this.insuranceService.getAllProposals().subscribe({
      next: (proposals) => {
        console.log(`📋 Found ${proposals.length} proposals in system:`, proposals);
        
        if (proposals.length === 0) {
          console.warn('⚠️ No proposals found - you need to create proposals first before submitting claims');
          this.submitMessage = 'No proposals found. Please create some insurance proposals first, then you can submit claims against them.';
          
          setTimeout(() => {
            this.submitMessage = '';
          }, 5000);
        } else {
          console.log('✅ Proposals available for claims:', proposals.map(p => ({ id: p.id, vehicleType: p.vehicleType, status: p.status })));
          this.createTestClaims();
        }
      },
      error: (error) => {
        console.error('❌ Failed to check proposals:', error);
        this.submitMessage = 'Failed to check available proposals. Please try again.';
        
        setTimeout(() => {
          this.submitMessage = '';
        }, 5000);
      }
    });
  }
}

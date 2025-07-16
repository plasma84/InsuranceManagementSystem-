import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { InsuranceService, Proposal } from '../../services/insurance.service';

@Component({
  selector: 'app-proposal-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proposal-form.component.html',
  styleUrls: ['./proposal-form.component.scss']
})
export class ProposalFormComponent implements OnInit {
  proposal: Proposal = {
    vehicleType: '',
    vehicleNumber: '',
    policyPackage: '',
    premiumAmount: 0
  };

  vehicleTypes = [
    { value: 'Car', label: 'Car', baseRate: 5000 },
    { value: 'Motorcycle', label: 'Motorcycle', baseRate: 3000 },
    { value: 'Truck', label: 'Truck', baseRate: 10000 },
    { value: 'Luxury Car', label: 'Luxury Car', baseRate: 7500 },
    { value: 'Camper Van', label: 'Camper Van', baseRate: 7000 }
  ];

  policyPackages: any[] = [];
  loading = false;
  error = '';
  success = false;

  constructor(
    public readonly authService: AuthService,
    private readonly router: Router,
    private readonly insuranceService: InsuranceService
  ) {}

  ngOnInit() {
    // Check authentication first
    if (!this.authService.isAuthenticated()) {
      this.error = 'Please login first to submit a proposal.';
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 3000);
      return;
    }
    
    this.loadPolicyPackages();
  }

  loadPolicyPackages() {
    this.insuranceService.getPolicyPackages().subscribe({
      next: (packages) => {
        this.policyPackages = packages;
      },
      error: (error) => {
        console.error('Error loading policy packages:', error);
      }
    });
  }

  onVehicleTypeChange() {
    this.calculatePremium();
  }

  onPolicyPackageChange() {
    this.calculatePremium();
  }

  calculatePremium() {
    if (this.proposal.vehicleType && this.proposal.policyPackage) {
      const vehicleType = this.vehicleTypes.find(v => v.value === this.proposal.vehicleType);
      const policyPackage = this.policyPackages.find(p => p.name === this.proposal.policyPackage);
      
      if (vehicleType && policyPackage) {
        this.proposal.premiumAmount = vehicleType.baseRate + (policyPackage.price ?? 0);
      }
    }
  }

  onSubmit() {
    console.log('=== PROPOSAL SUBMISSION DEBUG ===');
    console.log('1. Form submission started');
    console.log('2. Form validity check:', this.isFormValid());
    console.log('3. Proposal data:', JSON.stringify(this.proposal, null, 2));
    
    // Check authentication first
    if (!this.authService.isAuthenticated()) {
      this.error = 'Your session has expired. Please login again.';
      console.log('4. ERROR: User not authenticated');
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
      return;
    }

    // Get current user email
    const userEmail = this.authService.getUserEmail();
    console.log('7. User email from auth service:', userEmail);
    
    if (!userEmail) {
      this.error = 'Your session has expired. Please login again.';
      console.log('8. ERROR: No user email found - session expired');
      // Clear any expired tokens
      this.authService.logout();
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
      return;
    }

    // Check user role
    const userRole = this.authService.getUserRole();
    if (userRole !== 'USER') {
      this.error = 'Only users can submit proposals. Please login as a User, not an Officer.';
      console.log('5. ERROR: Wrong user role:', userRole);
      return;
    }
    
    if (!this.isFormValid()) {
      this.error = 'Please fill in all required fields.';
      console.log('6. ERROR: Form validation failed');
      return;
    }

    this.loading = true;
    this.error = '';
    console.log('9. Starting proposal submission for email:', userEmail);

    // First validate the token to ensure it's not expired
    this.authService.validateToken().subscribe({
      next: () => {
        console.log('10. Token validation successful, proceeding with submission');
        this.submitProposalDirectly(userEmail);
      },
      error: (error) => {
        console.log('10. ERROR: Token validation failed:', error);
        this.loading = false;
        this.error = 'Your session has expired. Please login again.';
        this.authService.logout();
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      }
    });
  }

  private submitProposalDirectly(userEmail: string) {
    console.log('10. Attempting direct proposal submission...');
    
    // Try to find user by email and submit proposal
    this.insuranceService.getAllUsers().subscribe({
      next: (users) => {
        console.log('11. Users fetched successfully, count:', users.length);
        const currentUser = users.find(u => u.email === userEmail);
        
        if (!currentUser?.id) {
          console.log('12. ERROR: User not found with email:', userEmail);
          this.loading = false;
          this.error = 'User account not found. Please contact support.';
          return;
        }

        console.log('13. Found user:', { id: currentUser.id, email: currentUser.email, role: currentUser.role });
        console.log('14. Submitting proposal for user ID:', currentUser.id);
        
        // Submit the proposal
        this.insuranceService.submitProposal(currentUser.id, this.proposal).subscribe({
          next: (response) => {
            console.log('15. SUCCESS! Proposal submitted:', response);
            this.loading = false;
            this.success = true;
            
            setTimeout(() => {
              console.log('16. Redirecting to dashboard...');
              this.router.navigate(['/dashboard']);
            }, 2000);
          },
          error: (error) => {
            console.error('15. ERROR! Proposal submission failed:', error);
            this.loading = false;
            
            if (error.status === 403 || error.status === 401) {
              this.error = 'Authentication failed. Please login again and try.';
            } else if (error.status === 0) {
              this.error = 'Network error. Please check your connection and try again.';
            } else {
              this.error = `Submission failed: ${error.message || 'Please try again.'}`;
            }
          }
        });
      },
      error: (error) => {
        console.error('11. ERROR! Failed to fetch users:', error);
        this.loading = false;
        
        if (error.status === 0) {
          this.error = 'Network error. Please check your connection.';
        } else if (error.status === 403 || error.status === 401) {
          this.error = 'Authentication failed. Please login again.';
        } else {
          this.error = 'Failed to load user data. Please try again.';
        }
      }
    });
  }

  isFormValid(): boolean {
    return !!(
      this.proposal.vehicleType &&
      this.proposal.vehicleNumber &&
      this.proposal.policyPackage &&
      this.proposal.premiumAmount > 0
    );
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}

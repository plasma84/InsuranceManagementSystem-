import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { InsuranceService, Proposal, User } from '../../services/insurance.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  user: User | null = null;
  proposals: Proposal[] = [];
  loading = true;
  stats = {
    totalPolicies: 0,
    activePolicies: 0,
    totalPremium: 0,
    nextPayment: null as Date | null
  };
  
  // Officer-specific statistics
  officerStats = {
    pendingClaims: 0,
    approvedClaims: 0,
    rejectedClaims: 0,
    totalProposalsReviewed: 0
  };
  
  // Get user role for dashboard customization
  getUserRole(): string | null {
    return this.authService.getUserRole();
  }
  
  // Check if current user is an officer
  isOfficer(): boolean {
    return this.getUserRole() === 'OFFICER';
  }
  
  // Check if current user is an admin
  isAdmin(): boolean {
    return this.getUserRole() === 'ADMIN';
  }
  
  // Check if current user is a regular customer
  isCustomer(): boolean {
    return this.getUserRole() === 'USER';
  }

  constructor(
    public readonly authService: AuthService, // Make public for template access
    private readonly router: Router,
    private readonly insuranceService: InsuranceService
  ) {}

  ngOnInit() {
    // Check authentication first
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    
    console.log('Dashboard ngOnInit - Starting to load user data');
    console.log('User role:', this.getUserRole());
    
    // Load appropriate data based on user role
    if (this.isOfficer() || this.isAdmin()) {
      this.loadOfficerData();
    } else {
      this.loadUserData();
    }
  }

  // Method to refresh user data (can be called when returning from other pages)
  refreshUserData() {
    const userEmail = this.authService.getUserEmail();
    if (userEmail) {
      console.log('🔄 Refreshing user data...');
      this.loading = true;
      
      if (this.isOfficer() || this.isAdmin()) {
        this.loadOfficerData();
      } else {
        this.loadUserData();
      }
    }
  }

  get userProposals(): Proposal[] {
    return this.user?.proposals || [];
  }

  get hasProposals(): boolean {
    return this.userProposals.length > 0;
  }

  loadUserData() {
    const userEmail = this.authService.getUserEmail();
    
    if (!userEmail) {
      this.router.navigate(['/login']);
      return;
    }

    console.log('🔄 Loading user data for:', userEmail);
    this.loading = true;
    
    // Create a basic user object to avoid blank screen
    this.user = {
      name: userEmail.split('@')[0],
      email: userEmail,
      address: 'Demo Address, Mumbai, India',
      dateOfBirth: '1990-01-01',
      aadhaarNumber: '1234-5678-9012',
      panNumber: 'ABCDE1234F',
      role: 'USER',
      proposals: []
    };
    
    this.proposals = [];
    this.resetStats();
    this.loading = false;
    
    // Try to load real data from API in the background
    this.loadRealDataFromAPI(userEmail);
  }

  // Simplified method to load real data from API without fallback complexity
  private loadRealDataFromAPI(userEmail: string) {
    if (!this.authService.isAuthenticated()) {
      console.log('❌ User not authenticated, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }

    console.log('🌐 Loading real data from API for:', userEmail);

    // Get user and their proposals from API
    this.insuranceService.getAllUsers().subscribe({
      next: (users) => {
        console.log('✅ Successfully loaded users, count:', users.length);
        const foundUser = users.find(u => u.email === userEmail);
        
        if (foundUser?.id) {
          console.log('✅ Found user in database:', foundUser);
          
          // Set user data
          this.user = foundUser;
          
          // Get user's proposals
          this.insuranceService.getUserProposals(foundUser.id).subscribe({
            next: (proposals) => {
              console.log('✅ Loaded user proposals:', proposals?.length || 0);
              
              if (proposals && proposals.length > 0) {
                this.proposals = proposals;
                this.user!.proposals = proposals;
                this.calculateStats();
                console.log('📊 Stats calculated:', this.stats);
              } else {
                console.log('ℹ️ No proposals found for user');
                this.proposals = [];
                this.resetStats();
              }
              
              this.loading = false;
            },
            error: (error) => {
              console.error('❌ Error loading proposals:', error);
              this.proposals = [];
              this.resetStats();
              this.loading = false;
            }
          });
        } else {
          console.warn('⚠️ User not found in database:', userEmail);
          this.createDefaultUser(userEmail);
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('❌ Error loading users:', error);
        this.createDefaultUser(userEmail);
        this.loading = false;
      }
    });
  }

  // Create a default user if not found in database
  private createDefaultUser(userEmail: string) {
    this.user = {
      name: userEmail.split('@')[0],
      email: userEmail,
      address: 'Address not provided',
      dateOfBirth: '1990-01-01',
      aadhaarNumber: 'Not provided',
      panNumber: 'Not provided',
      role: 'USER',
      proposals: []
    };
    this.proposals = [];
    this.resetStats();
  }

  // Calculate statistics from real proposals data
  private calculateStats() {
    if (!this.proposals || this.proposals.length === 0) {
      this.resetStats();
      return;
    }

    const activeProposals = this.proposals.filter(p => 
      p.status === 'ACTIVE' || p.status === 'APPROVED'
    );
    
    const totalPremium = this.proposals.reduce((sum, p) => 
      sum + (p.premiumAmount || 0), 0
    );

    this.stats = {
      totalPolicies: this.proposals.length,
      activePolicies: activeProposals.length,
      totalPremium: totalPremium,
      nextPayment: this.calculateNextPaymentDate()
    };
  }

  // Reset statistics to zero
  private resetStats() {
    this.stats = {
      totalPolicies: 0,
      activePolicies: 0,
      totalPremium: 0,
      nextPayment: null
    };
  }

  // Calculate next payment date based on active policies
  private calculateNextPaymentDate(): Date | null {
    const activeProposals = this.proposals.filter(p => 
      p.status === 'ACTIVE' || p.status === 'APPROVED'
    );
    
    if (activeProposals.length === 0) return null;
    
    // For demo purposes, return next month
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth;
  }

  // Load officer-specific data and statistics
  loadOfficerData() {
    const userEmail = this.authService.getUserEmail();
    const userRole = this.authService.getUserRole();
    
    if (userEmail) {
      console.log('Loading officer dashboard for:', userEmail);
      
      // Create officer user profile
      this.user = {
        name: userEmail.split('@')[0].replace(/\d/g, '').replace(/officer/gi, 'Officer ').trim(),
        email: userEmail,
        address: 'Insurance Office, Corporate Branch',
        dateOfBirth: '1980-01-01', // Default date for officers
        aadhaarNumber: 'N/A',
        panNumber: 'N/A',
        role: userRole || 'OFFICER',
        proposals: [] // Officers don't have personal proposals
      };
      
      // Load officer-specific statistics
      this.loadOfficerStatistics();
      
      this.loading = false;
    } else {
      this.router.navigate(['/login']);
    }
  }
  
  // Load statistics relevant to officers (claims, proposals to review, etc.)
  private loadOfficerStatistics() {
    // For now, set sample statistics - in a real app, this would come from API
    this.officerStats = {
      pendingClaims: 12,
      approvedClaims: 45,
      rejectedClaims: 8,
      totalProposalsReviewed: 156
    };
    
    // Reset user statistics since officers don't have personal policies
    this.stats = {
      totalPolicies: 0,
      activePolicies: 0,
      totalPremium: 0,
      nextPayment: null
    };
    
    console.log('Officer statistics loaded:', this.officerStats);
  }

  private tryLoadFromAPI(userEmail: string) {
    // Only try API call if user is authenticated
    if (!this.authService.isAuthenticated()) {
      console.log('User not authenticated, skipping API call');
      return;
    }

    console.log('=== TRYING TO LOAD FROM API ===');
    console.log('User email:', userEmail);
    console.log('Auth token exists:', !!this.authService.getToken());
    console.log('User role:', this.authService.getUserRole());
    console.log('🔍 DEBUGGING: About to call getAllUsers API...');

    // Get user and their proposals from API
    this.insuranceService.getAllUsers().subscribe({
      next: (users) => {
        console.log('✅ API: Successfully loaded users, count:', users.length);
        const foundUser = users.find(u => u.email === userEmail);
        if (foundUser?.id) {
          console.log('✅ API: Found user in database:', foundUser);
          
          // Get user's proposals from the proposals API
          this.insuranceService.getUserProposals(foundUser.id).subscribe({
            next: (proposals) => {
              console.log('✅ API: Loaded user proposals successfully:', proposals);
              console.log('Number of real proposals found:', proposals?.length || 0);
              
              // Update user with real data from API
              this.user = {
                ...foundUser,
                proposals: proposals || []
              };
              this.updateStats();
              this.loading = false;
              console.log('✅ DASHBOARD: Updated with real API data');
            },
            error: (error) => {
              console.warn('❌ API: Could not load user proposals:', error);
              console.warn('Error details:', {
                status: error.status,
                statusText: error.statusText,
                message: error.message
              });
              // Keep existing user data, just log the error
              this.loading = false;
            }
          });
        } else {
          console.warn('❌ API: User not found in database with email:', userEmail);
          console.warn('Available users:', users.map(u => u.email));
          this.loading = false;
        }
      },
      error: (error) => {
        console.warn('❌ API: Could not load users:', error);
        console.warn('Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message
        });
        // Keep existing fallback data, just log the error
        this.loading = false;
      }
    });
  }

  private loadFallbackData(userEmail: string, userRole: string | null) {
    console.log('Loading fallback data for user:', userEmail);
    console.log('User role:', userRole);
    
    // Create fallback user data with NO PROPOSALS initially
    // This will force the display to show "No policies yet" until real data loads
    this.user = {
      name: userEmail.split('@')[0],
      email: userEmail,
      address: 'Demo Address, Mumbai, India',
      dateOfBirth: '1990-01-01',
      aadhaarNumber: '1234-5678-9012',
      panNumber: 'ABCDE1234F',
      role: userRole ?? 'USER',
      proposals: [] // Start with empty array - real data will replace this
    };
    
    console.log('Fallback user data created with empty proposals:', this.user);
    this.updateStats();
    this.loading = false;
    console.log('Dashboard loading completed with fallback data (empty proposals)');
  }

  updateStats() {
    if (this.user?.proposals) {
      this.stats.totalPolicies = this.user.proposals.length;
      this.stats.activePolicies = this.user.proposals.filter(p => 
        p.status === 'PROPOSAL_SUBMITTED' || p.status === 'ACTIVE'
      ).length;
      this.stats.totalPremium = this.user.proposals.reduce((sum, p) => sum + p.premiumAmount, 0);
      
      console.log('📊 STATS UPDATED:');
      console.log('Total Policies:', this.stats.totalPolicies);
      console.log('Active Policies:', this.stats.activePolicies);
      console.log('Total Premium:', this.stats.totalPremium);
      console.log('User Role:', this.user.role);
      console.log('Proposals:', this.user.proposals);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  navigateToNewProposal() {
    this.router.navigate(['/new-proposal']);
  }

  navigateToClaims() {
    this.router.navigate(['/claims']);
  }

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }

  navigateToSupport() {
    // For now, navigate to a support/help section or external help
    // You can create a support component later
    window.open('mailto:support@autoinsure.com?subject=Support Request', '_blank');
  }

  // Officer-specific navigation methods
  navigateToClaimsManagement() {
    this.router.navigate(['/officer/claims']);
  }

  navigateToProposalReview() {
    this.router.navigate(['/officer/proposals']);
  }

  // Tracking ongoing delete operations to prevent double-clicks
  private readonly deletingProposals = new Set<number>();

  // Delete Policy Method
  deletePolicy(proposal: Proposal, event?: Event) {
    if (!proposal.id) {
      console.error('Cannot delete policy: No proposal ID');
      alert('Cannot delete policy: Invalid policy ID');
      return;
    }

    // Prevent multiple delete requests for the same proposal
    if (this.deletingProposals.has(proposal.id)) {
      console.log('Delete already in progress for proposal:', proposal.id);
      return;
    }

    // Show confirmation dialog
    const confirmDelete = confirm(
      `Are you sure you want to delete this policy?\n\n` +
      `Vehicle: ${proposal.vehicleNumber}\n` +
      `Package: ${proposal.policyPackage}\n` +
      `Premium: ₹${proposal.premiumAmount}\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmDelete) {
      return;
    }

    console.log('🗑️ Deleting policy:', proposal);
    
    // Add to tracking set
    this.deletingProposals.add(proposal.id);
    
    // Don't set global loading to true, just disable the button
    const deleteButton = event?.target as HTMLButtonElement;
    if (deleteButton) {
      deleteButton.disabled = true;
      deleteButton.textContent = 'Deleting...';
    }

    this.insuranceService.deleteProposal(proposal.id).subscribe({
      next: (response) => {
        console.log('✅ Policy deleted successfully:', response);
        
        // Remove from tracking set
        this.deletingProposals.delete(proposal.id!);
        
        // Remove the proposal from the local array
        this.proposals = this.proposals.filter(p => p.id !== proposal.id);
        
        // Update user proposals if user object exists
        if (this.user?.proposals) {
          this.user.proposals = this.user.proposals.filter(p => p.id !== proposal.id);
        }
        
        // Update stats
        this.updateStats();
        
        // Show success message
        alert('Policy deleted successfully!');
        
        // Re-enable button (though it should be removed from DOM)
        if (deleteButton) {
          deleteButton.disabled = false;
          deleteButton.innerHTML = '<i class="fas fa-trash"></i> Delete';
        }
      },
      error: (error) => {
        console.error('❌ Failed to delete policy:', error);
        
        // Remove from tracking set
        this.deletingProposals.delete(proposal.id!);
        
        // Re-enable button
        if (deleteButton) {
          deleteButton.disabled = false;
          deleteButton.innerHTML = '<i class="fas fa-trash"></i> Delete';
        }
        
        // Show specific error messages
        if (error.status === 403) {
          alert('You do not have permission to delete this policy.');
        } else if (error.status === 404) {
          alert('Delete endpoint not found. The backend may need to be restarted with the new delete functionality.');
        } else if (error.status === 500) {
          // Handle the specific case where policy was already deleted
          const errorMessage = error.error || error.message || '';
          if (errorMessage.includes('Proposal not found') || errorMessage.includes('not found with id')) {
            console.log('Policy already deleted, removing from local list');
            // Remove from local array since it was already deleted
            this.proposals = this.proposals.filter(p => p.id !== proposal.id);
            if (this.user?.proposals) {
              this.user.proposals = this.user.proposals.filter(p => p.id !== proposal.id);
            }
            this.updateStats();
            alert('Policy has already been deleted.');
          } else {
            alert('Server error occurred while deleting the policy.');
          }
        } else if (error.status === 0) {
          alert('Cannot connect to server. Please ensure the backend is running.');
        } else {
          alert(`Failed to delete policy (Error ${error.status}). Please try again or contact support.`);
        }
      }
    });
  }

  // Check if a proposal is currently being deleted
  isDeleting(proposalId: number | undefined): boolean {
    return proposalId ? this.deletingProposals.has(proposalId) : false;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PROPOSAL_SUBMITTED':
        return '#3182ce';
      case 'ACTIVE':
        return '#38a169';
      case 'EXPIRED':
        return '#e53e3e';
      default:
        return '#718096';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'PROPOSAL_SUBMITTED':
        return 'fas fa-clock';
      case 'ACTIVE':
        return 'fas fa-check-circle';
      case 'EXPIRED':
        return 'fas fa-times-circle';
      default:
        return 'fas fa-question-circle';
    }
  }

  // Helper method to get debug info
  public getDebugInfo() {
    return {
      userEmail: this.authService.getUserEmail(),
      userRole: this.authService.getUserRole(),
      isAuthenticated: this.authService.isAuthenticated(),
      hasToken: !!this.authService.getToken(),
      userObject: this.user,
      proposalCount: this.user?.proposals?.length || 0,
      timestamp: new Date().toISOString()
    };
  }

  // Method to test authentication and force data reload
  public testAndReload() {
    console.log('🔧 TEST AND RELOAD TRIGGERED');
    console.log('Current debug info:', this.getDebugInfo());
    
    // Test authentication first
    this.authService.testAuthentication().subscribe({
      next: (response) => {
        console.log('✅ Auth test successful, reloading data...');
        this.loading = true;
        this.loadUserData();
      },
      error: (error) => {
        console.error('❌ Auth test failed:', error);
        if (error.status === 403) {
          console.log('🔄 Token expired, forcing re-login...');
          this.authService.forceReLogin();
          this.router.navigate(['/login']);
        }
      }
    });
  }

  // Force refresh from API (for debugging)
  forceRefreshFromAPI(): void {
    console.log('🔄 FORCE REFRESH: Starting...');
    const userEmail = this.authService.getUserEmail();
    if (userEmail) {
      this.loading = true;
      this.tryLoadFromAPI(userEmail);
    } else {
      console.log('❌ FORCE REFRESH: No user email found');
    }
  }

  public testAPIEndpoints() {
    console.log('🧪 === STARTING COMPREHENSIVE API TEST ===');
    const userEmail = this.authService.getUserEmail();
    
    if (!userEmail) {
      console.error('❌ No user email found');
      return;
    }

    console.log(`🔍 Testing API for user: ${userEmail}`);
    console.log(`🔍 Auth token: ${this.authService.getToken() ? 'EXISTS' : 'MISSING'}`);
    console.log(`🔍 User role: ${this.authService.getUserRole()}`);

    // Test 1: Get all users
    console.log('\n📋 Test 1: Getting all users...');
    this.insuranceService.getAllUsers().subscribe({
      next: (users) => {
        console.log(`✅ Users API successful, count: ${users.length}`);
        const foundUser = users.find(u => u.email === userEmail);
        
        if (foundUser) {
          console.log(`✅ Found user in database:`, foundUser);
          console.log(`🆔 User ID: ${foundUser.id}`);
          
          // Test 2: Get proposals for this specific user
          console.log(`\n📋 Test 2: Getting proposals for user ID ${foundUser.id}...`);
          this.insuranceService.getUserProposals(foundUser.id!).subscribe({
            next: (proposals) => {
              console.log(`✅ User proposals API successful!`);
              console.log(`📊 Proposals found: ${proposals?.length || 0}`);
              console.log(`📋 Proposal details:`, proposals);
              
              if (proposals && proposals.length > 0) {
                proposals.forEach((proposal, index) => {
                  console.log(`   Proposal ${index + 1}:`, {
                    id: proposal.id,
                    vehicleType: proposal.vehicleType,
                    status: proposal.status,
                    premiumAmount: proposal.premiumAmount
                  });
                });
              } else {
                console.warn('⚠️ No proposals found for this user in the database');
                console.log('💡 This means either:');
                console.log('   1. No policies have been created for this user');
                console.log('   2. Policies were created but linked to a different user ID');
                console.log('   3. Database connection or data retrieval issue');
              }
            },
            error: (error) => {
              console.error('❌ User proposals API failed:', error);
              console.log('🔍 Error details:', {
                status: error.status,
                message: error.message,
                url: error.url
              });
            }
          });
        } else {
          console.error(`❌ User with email ${userEmail} not found in database`);
          console.log('💡 This might mean the user was created in a different session or database');
          console.log('🔍 Available users:', users.map(u => ({ id: u.id, email: u.email })));
        }
      },
      error: (error) => {
        console.error('❌ Users API failed:', error);
        console.log('🔍 This indicates a fundamental API connectivity issue');
      }
    });

    // Test 3: Get all proposals (to see if any exist at all)
    console.log('\n📋 Test 3: Getting ALL proposals in system...');
    this.insuranceService.getAllProposals().subscribe({
      next: (allProposals) => {
        console.log(`✅ All proposals API successful!`);
        console.log(`📊 Total proposals in system: ${allProposals?.length || 0}`);
        if (allProposals && allProposals.length > 0) {
          console.log('🔍 All proposals in system:', allProposals);
        }
      },
      error: (error) => {
        console.error('❌ All proposals API failed:', error);
      }
    });
  }

  public logDebugInfo() {
    console.log('Debug Info:', this.getDebugInfo());
  }
  
  // Test authentication with detailed debugging
  public testAuthentication(): void {
    console.log('🔍 === AUTHENTICATION DEBUG TEST ===');
    
    this.authService.testAuthentication().subscribe({
      next: (response) => {
        console.log('✅ Authentication working correctly!');
        this.forceRefreshFromAPI(); // Reload data if auth is working
      },
      error: (error) => {
        console.error('❌ Authentication failed - this explains the 403 errors');
        
        if (error.status === 403) {
          console.log('🔧 Recommendation: Login again to get a fresh token');
          
          if (confirm('Authentication failed. Would you like to logout and login again?')) {
            this.authService.forceReLogin();
            this.router.navigate(['/login']);
          }
        }
      }
    });
  }
  
  // Method to refresh authentication session
  public refreshAuthentication(): void {
    console.log('🔄 Attempting to refresh authentication...');
    
    this.authService.refreshSession().subscribe({
      next: (response) => {
        console.log('✅ Authentication refreshed successfully!');
        this.forceRefreshFromAPI(); // Reload data with fresh auth
      },
      error: (error) => {
        console.error('❌ Could not refresh authentication');
        alert('Authentication expired. Please login again.');
        this.router.navigate(['/login']);
      }
    });
  }
  
  // Quick login method for testing (using sample credentials)
  public quickLogin(): void {
    console.log('🚀 Attempting quick login with test credentials...');
    
    const loginData = {
      email: 'john.doe@example.com',
      password: 'TestPassword123!',
      userType: 'USER' as const
    };
    
    this.authService.login(loginData).subscribe({
      next: (response) => {
        console.log('✅ Quick login successful!', response);
        alert('Login successful! Refreshing dashboard data...');
        this.forceRefreshDashboard(); // Immediately refresh dashboard
      },
      error: (error) => {
        console.error('❌ Quick login failed:', error);
        alert('Quick login failed. Please try manual login.');
      }
    });
  }
  
  // Quick officer login for testing claims management
  public quickOfficerLogin(): void {
    console.log('🚀 Attempting quick officer login...');
    
    const loginData = {
      email: 'officer1@insurance.com',
      password: 'OfficerSecure789!',
      userType: 'OFFICER' as const
    };
    
    this.authService.login(loginData).subscribe({
      next: (response) => {
        console.log('✅ Quick officer login successful!', response);
        alert('Officer login successful! Refreshing dashboard...');
        this.forceRefreshDashboard(); // Immediately refresh dashboard
      },
      error: (error) => {
        console.error('❌ Quick officer login failed:', error);
        alert('Quick officer login failed.');
      }
    });
  }
  
  // Quick admin login for testing admin functionality
  public quickAdminLogin(): void {
    console.log('🚀 Attempting quick admin login...');
    
    const loginData = {
      email: 'admin@insurance.com',
      password: 'AdminSecure123!',
      userType: 'ADMIN' as const
    };
    
    this.authService.login(loginData).subscribe({
      next: (response) => {
        console.log('✅ Quick admin login successful!', response);
        alert('Admin login successful! Refreshing dashboard...');
        this.forceRefreshDashboard(); // Immediately refresh dashboard
      },
      error: (error) => {
        console.error('❌ Quick admin login failed:', error);
        alert('Quick admin login failed.');
      }
    });
  }
  
  // Force refresh all dashboard data
  public forceRefreshDashboard(): void {
    console.log('🔄 Force refreshing dashboard data...');
    
    // Reset everything
    this.user = null;
    this.proposals = [];
    this.stats = {
      totalPolicies: 0,
      activePolicies: 0,
      totalPremium: 0,
      nextPayment: null
    };
    this.loading = true;
    
    // Reload everything
    setTimeout(() => {
      this.loadUserData();
    }, 500); // Small delay to ensure token is properly set
  }

  // Comprehensive diagnostic method to understand what's happening
  public runDashboardDiagnostic(): void {
    console.log('🔍 === DASHBOARD DIAGNOSTIC START ===');
    
    // 1. Check Authentication
    const isAuth = this.authService.isAuthenticated();
    const token = this.authService.getToken();
    const email = this.authService.getUserEmail();
    const role = this.authService.getUserRole();
    
    console.log('🔐 Authentication Status:');
    console.log('  - Is Authenticated:', isAuth);
    console.log('  - Has Token:', !!token);
    console.log('  - Token Preview:', token ? token.substring(0, 30) + '...' : 'null');
    console.log('  - User Email:', email);
    console.log('  - User Role:', role);
    
    // 2. Check Current Data State
    console.log('📊 Current Dashboard State:');
    console.log('  - User Object:', this.user);
    console.log('  - Proposals Array:', this.proposals);
    console.log('  - Proposals Length:', this.proposals?.length || 0);
    console.log('  - Stats Object:', this.stats);
    console.log('  - Loading State:', this.loading);
    
    // 3. Try to make API call and see what happens
    if (isAuth && token && email) {
      console.log('🌐 Testing API Call...');
      
      // Test user endpoint
      this.authService.testAuthentication().subscribe({
        next: (users) => {
          console.log('✅ User API Response:', users);
          console.log('  - Users Count:', users?.length || 0);
          
          // If we get users, try to find the current user
          if (users && users.length > 0) {
            const currentUser = users.find((u: any) => u.email === email);
            console.log('👤 Current User Found:', currentUser);
            
            if (currentUser?.id) {
              console.log('🔍 Fetching proposals for user ID:', currentUser.id);
              
              // Test proposals endpoint
              this.insuranceService.getUserProposals(currentUser.id).subscribe({
                next: (proposals) => {
                  console.log('✅ Proposals API Response:', proposals);
                  console.log('  - Proposals Count:', proposals?.length || 0);
                  console.log('  - First Proposal:', proposals?.[0]);
                  
                  if (!proposals || proposals.length === 0) {
                    console.log('⚠️ NO PROPOSALS FOUND - This explains the 0 policies!');
                    console.log('💡 Suggestion: Create a new policy or use test data');
                  }
                },
                error: (error) => {
                  console.error('❌ Proposals API Error:', error);
                  console.log('🔧 This explains why policies are 0!');
                }
              });
            }
          }
        },
        error: (error) => {
          console.error('❌ User API Error:', error);
          console.log('🔧 This explains why the dashboard shows 0!');
          
          if (error.status === 403) {
            console.log('💡 Solution: Use Quick Login button to get a fresh token');
          }
        }
      });
    } else {
      console.log('❌ Cannot test API - Missing authentication');
      console.log('💡 Solution: Use Quick Login button first');
    }
    
    console.log('🔍 === DASHBOARD DIAGNOSTIC END ===');
  }
}
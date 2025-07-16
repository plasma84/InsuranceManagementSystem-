import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { InsuranceService, User } from '../../services/insurance.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  editMode = false;
  loading = true;
  saving = false;
  error = '';
  success = '';

  // Form data for editing
  editUser: User = {
    name: '',
    email: '',
    address: '',
    dateOfBirth: '',
    aadhaarNumber: '',
    panNumber: ''
  };

  constructor(
    public readonly authService: AuthService,
    private readonly router: Router,
    private readonly insuranceService: InsuranceService
  ) {}

  ngOnInit() {
    // Check authentication first
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.loadUserProfile();
  }

  loadUserProfile() {
    const userEmail = this.authService.getUserEmail();
    
    if (!userEmail) {
      this.error = 'User not authenticated. Please login again.';
      this.loading = false;
      return;
    }

    // Get all users to find the current user's profile
    this.insuranceService.getAllUsers().subscribe({
      next: (users) => {
        const currentUser = users.find(u => u.email === userEmail);
        if (currentUser) {
          this.user = currentUser;
          this.editUser = { ...currentUser }; // Create a copy for editing
        } else {
          this.error = 'User profile not found.';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
        this.error = 'Failed to load user profile. Please try again.';
        this.loading = false;
      }
    });
  }

  toggleEditMode() {
    if (this.editMode) {
      // Cancel editing - reset form data
      this.editUser = { ...this.user! };
      this.editMode = false;
      this.error = '';
      this.success = '';
    } else {
      // Enable editing
      this.editMode = true;
      this.error = '';
      this.success = '';
    }
  }

  saveProfile() {
    if (!this.user?.id) {
      this.error = 'Cannot save profile: User ID not found.';
      return;
    }

    if (!this.isFormValid()) {
      this.error = 'Please fill in all required fields correctly.';
      return;
    }

    this.saving = true;
    this.error = '';

    // Call update user API
    this.insuranceService.updateUser(this.user.id, this.editUser).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.editUser = { ...updatedUser };
        this.editMode = false;
        this.saving = false;
        this.success = 'Profile updated successfully!';
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          this.success = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.error = 'Failed to update profile. Please try again.';
        this.saving = false;
      }
    });
  }

  isFormValid(): boolean {
    return !!(
      this.editUser.name &&
      this.editUser.email &&
      this.editUser.address &&
      this.editUser.dateOfBirth &&
      this.editUser.aadhaarNumber &&
      this.editUser.panNumber &&
      this.isValidEmail(this.editUser.email) &&
      this.isValidAadhaar(this.editUser.aadhaarNumber) &&
      this.isValidPAN(this.editUser.panNumber)
    );
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidAadhaar(aadhaar: string): boolean {
    // 12 digits
    const aadhaarRegex = /^\d{12}$/;
    return aadhaarRegex.test(aadhaar.replace(/\s/g, ''));
  }

  isValidPAN(pan: string): boolean {
    // PAN format: ABCDE1234F
    const panRegex = /^[A-Z]{5}\d{4}[A-Z]$/;
    return panRegex.test(pan.toUpperCase());
  }

  changePassword() {
    // This would typically open a modal or navigate to a password change page
    alert('Password change functionality coming soon!');
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getActivePoliciesCount(): number {
    if (!this.user?.proposals) return 0;
    return this.user.proposals.filter(p => p.status === 'ACTIVE' || p.status === 'PROPOSAL_SUBMITTED').length;
  }

  getTotalPremium(): number {
    if (!this.user?.proposals) return 0;
    return this.user.proposals.reduce((sum, p) => sum + (p.premiumAmount || 0), 0);
  }
}

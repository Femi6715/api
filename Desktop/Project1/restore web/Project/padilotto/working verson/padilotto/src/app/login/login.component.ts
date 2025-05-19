import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { FlashMessagesService } from 'angular2-flash-messages';
import { Router } from '@angular/router';
import { RandomService } from '../services/random.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  angForm: FormGroup;
  resetFormField: FormGroup;
  loading = false;
  forgotPwd = false;
  hidePassword = true;
  statusMessage = '';
  statusType = '';
  private isDestroyed = false;
  phoneNumber: string;
  email: string;

  constructor(private fb: FormBuilder,
    private authService: AuthService,
    private flashMessagesService: FlashMessagesService,
    private randomService: RandomService,
    private router: Router) { 
      this.createForm(); 
      this.resetForm(); 
    }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.isDestroyed = true;
  }

  createForm() {
    this.angForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  resetForm() {
    this.resetFormField = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(9)]]
    });
  }

  forgotPassword() {
    this.forgotPwd = true;
    this.statusMessage = '';
    // Reset any previous form state
    this.resetFormField.reset();
  }

  validateUsername(inputTxt) {
    const numbers = /^[0-9]+$/;
    return inputTxt.match(numbers);
  }

  randomString(length) {
    let result = '';
    const chars = '0123456789AabcdefghijklmnopqrstuvwxyzBCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = length; i > 0; --i) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  // Safe way to show flash messages
  safeShowFlashMessage(message: string, cssClass: string, timeout: number) {
    try {
      if (!this.isDestroyed && this.flashMessagesService && typeof this.flashMessagesService.show === 'function') {
        this.flashMessagesService.show(message, {
          cssClass: cssClass,
          timeout: timeout
        });
      } else {
        // Fallback to console if flash messages service isn't working
        console.log(message);
      }
    } catch (error) {
      console.error('Error showing flash message:', error);
    }
  }

  async resetSubmit() {
    if (this.resetFormField.invalid) {
      this.updateStatus('Please enter a valid email or phone number', 'error');
      return;
    }

    this.loading = true;
    const resetData = this.resetFormField.value;
    const verify = this.validateUsername(resetData.username);

    try {
      this.updateStatus('Processing your request...', 'info');
      if (verify) {
        const response = await this.authService.resetUserWithPhone(resetData.username);
        this.updateStatus(response.message, response.success ? 'success' : 'error');
      } else {
        const response = await this.authService.resetUserWithEmail(resetData.username);
        this.updateStatus(response.message, response.success ? 'success' : 'error');
      }
    } catch (error) {
      console.error('Reset error:', error);
      this.updateStatus('Password reset failed. Please try again.', 'error');
    } finally {
      this.loading = false;
      if (!this.isDestroyed && this.statusType === 'success') {
        // Only return to login form if reset was successful
        setTimeout(() => {
          if (!this.isDestroyed) {
            this.forgotPwd = false;
          }
        }, 3000);
      }
      this.resetFormField.reset();
    }
  }

  updateStatus(message: string, type: 'info' | 'success' | 'error' = 'info') {
    if (this.isDestroyed) return;
    this.statusMessage = message;
    this.statusType = type;
  }

  async loginSubmit() {
    if (this.angForm.invalid) {
      this.updateStatus('Please fill in all fields correctly', 'error');
      return;
    }

    this.loading = true;
    this.updateStatus('Signing in...', 'info');
    const formData = this.angForm.value;

    try {
      const response = await this.authService.login(formData.username, formData.password);
      
      if ('error' in response) {
        this.updateStatus(response.error || 'Login failed', 'error');
        this.safeShowFlashMessage(response.error || 'Login failed', 'alert-danger', 3000);
        this.loading = false;
        return;
      }

      // Show success message before navigation
      this.safeShowFlashMessage('Login successful', 'alert-success', 1500);

      // Reset form and set loading to false before navigation
      this.loading = false;
      this.angForm.reset();
      
      // Update login status
      this.randomService.updateLoginStatus(true);
      
      // Use a local variable to track if component is being destroyed
      const isDestroyed = this.isDestroyed;
      
      // Set a small timeout before navigating to ensure flash message is seen
      setTimeout(() => {
        // Only navigate if component is still active
        if (!isDestroyed) {
          // Navigate to home - this will destroy the component
          this.router.navigate(['/']);
        }
      }, 500);
    } catch (error) {
      console.error('Login error:', error);
      this.safeShowFlashMessage('Login failed. Please try again.', 'alert-danger', 3000);
      this.updateStatus('Connection error. Please try again.', 'error');
      this.loading = false;
    }
  }

  ngOnInit() {
    // Check if user is already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }
  }

  resetPassword(username: string, newPassword: string) {
    this.authService.resetPassword(username, newPassword)
      .then(response => {
        if (response.success) {
          this.updateStatus('Password reset successful', 'success');
        }
      })
      .catch(error => {
        console.error('Password reset error:', error);
        this.updateStatus('Password reset failed', 'error');
      });
  }

  async resetWithPhone() {
    try {
      const result = await this.authService.resetUserWithPhone(this.phoneNumber);
      if (result.success) {
        this.safeShowFlashMessage('Reset link sent to your phone', 'alert-success', 5000);
      } else {
        this.safeShowFlashMessage(result.message, 'alert-danger', 5000);
      }
    } catch (error) {
      this.safeShowFlashMessage('Failed to send reset link', 'alert-danger', 5000);
    }
  }

  async resetWithEmail() {
    try {
      const result = await this.authService.resetUserWithEmail(this.email);
      if (result.success) {
        this.safeShowFlashMessage('Reset link sent to your email', 'alert-success', 5000);
      } else {
        this.safeShowFlashMessage(result.message, 'alert-danger', 5000);
      }
    } catch (error) {
      this.safeShowFlashMessage('Failed to send reset link', 'alert-danger', 5000);
    }
  }
}

import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home-footer',
  templateUrl: './home-footer.component.html',
  styleUrls: ['./home-footer.component.css']
})
export class HomeFooterComponent implements OnInit {
  user: any = {};
  loading = true;
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  async ngOnInit() {
    try {
      const profile = this.authService.getCurrentUserProfile();
      if (profile) {
        this.user = profile;
      } else {
        // If no profile, try to refresh from API
        const userResult = await this.authService.refreshUserData();
        if ('error' in userResult) {
          this.error = userResult.error;
        } else {
          this.user = userResult;
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      this.error = 'Error loading profile';
    } finally {
      this.loading = false;
    }
  }

  // ... rest of the component code ...
} 
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  user: any;
  userStats: any = {
    totalTickets: 0,
    totalWinnings: 0,
    activeGames: 0
  };
  main_balance: number;
  bonus: number;

  constructor(private authService: AuthService) { }

  async ngOnInit() {
    try {
      const profile = await this.authService.getCurrentUserProfile();
      if (profile) {
        this.user = profile;
        this.main_balance = Number(profile.main_balance);
        this.bonus = Number(profile.bonus);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }
} 
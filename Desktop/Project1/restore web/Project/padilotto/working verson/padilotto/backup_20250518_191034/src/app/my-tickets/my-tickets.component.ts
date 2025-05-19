import { Component, OnInit } from '@angular/core';
import {MyTicketsService} from '../services/my-tickets.service';
import {AuthService} from '../services/auth.service';
import {FilterPipe} from '../filter.pipe';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { Router } from '@angular/router';

@Component({
  selector: 'app-my-tickets',
  templateUrl: './my-tickets.component.html',
  styleUrls: ['./my-tickets.component.css'],
  providers: [FilterPipe]
})


export class MyTicketsComponent implements OnInit {

  p: number = 1;
  public my_tickets: any[] = [];
  loading = false;
  user;
  term: any;

  constructor(private _my_tickets: MyTicketsService,
    private spinnerService: Ng4LoadingSpinnerService,
    private authApi: AuthService,
    private router: Router) { }

  async ngOnInit() {
    this.loading = true;
    
    // First check if the user is authenticated
    if (!this.authApi.isAuthenticated()) {
      console.log('User not authenticated, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }

    try {
      // Fetch the latest user profile data
      const profileResult = await this.authApi.refreshUserData();
      if ('error' in profileResult) {
        console.error('Error fetching profile:', profileResult.error);
        this.loading = false;
        return;
      }

      const profile = profileResult;
      const user_profile = {
        id: profile.id,
        user_id: profile.id, // Add user_id to match API expectations
        bonus: profile.bonus || 0,
        main_balance: profile.main_balance || 0
      };
      this.user = user_profile;
      
      // Enhanced debugging information
      console.log('Fetching tickets with user ID:', this.user.id);
      
      // Pass both id and user_id to ensure compatibility with the database schema
      const ticketKey = {id: this.user.id, user_id: this.user.id};
      console.log('Ticket request data:', JSON.stringify(ticketKey));
      
      this._my_tickets.getMyTickets(ticketKey)
        .subscribe(
          (response: any) => {
            // Check if response is an array or has tickets property
            if (Array.isArray(response)) {
              console.log(`Received ${response.length} tickets directly as array`);
              this.my_tickets = response;
            } else if (response && response.success && Array.isArray(response.tickets)) {
              console.log(`Received ${response.tickets.length} tickets in standard format`);
              this.my_tickets = response.tickets;
            } else {
              console.warn('Unexpected response format:', response);
              this.my_tickets = [];
            }
            
            // Log the first ticket for debugging (if available)
            if (this.my_tickets.length > 0) {
              console.log('Sample ticket data:', this.my_tickets[0]);
            }
            
            // Sort tickets by creation date (newest first)
            this.my_tickets.sort((a, b) => {
              // First try to use created_at timestamp
              if (a.created_at && b.created_at) {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
              }
              // Fall back to time_stamp if created_at is not available
              return b.time_stamp - a.time_stamp;
            });
            
            this.loading = false;
          },
          error => {
            console.error('Error fetching tickets:', error);
            this.loading = false;
          }
        );
    } catch (error) {
      console.error('Error loading profile:', error);
      this.loading = false;
    }
  }

  scroll() {
    window.scrollTo({ top: 100, behavior: 'smooth' });
  }
}

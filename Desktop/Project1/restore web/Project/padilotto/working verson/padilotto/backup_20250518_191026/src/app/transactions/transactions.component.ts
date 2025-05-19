import { Component, OnInit } from '@angular/core';
import { MyTicketsService } from '../services/my-tickets.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css']
})
export class TransactionsComponent implements OnInit {
  p: number = 1;
  public transactions: any[] = [];
  user: any;
  loading: boolean = false;
  error: string = '';

  constructor(private transaction_api: MyTicketsService,
    private authApi: AuthService) { }

  async ngOnInit() {
    try {
      this.loading = true;
      
      // Get user profile
      const profile = await this.authApi.getCurrentUserProfile();
      if (!profile) {
        this.error = 'Unable to load user profile';
        this.loading = false;
        return;
      }
      
      this.user = profile;
      console.log('User profile loaded');
      
      // Fetch transactions for the logged-in user (service now handles getting the user ID)
      this.transaction_api.getMyTransactions()
        .subscribe(
          (response: any) => {
            console.log('Transaction response:', response);
            // Check if response has 'transactions' property and it's an array
            if (response && response.success && Array.isArray(response.transactions)) {
              this.transactions = response.transactions;
              console.log(`Loaded ${this.transactions.length} transactions`);
            } else {
              console.warn('Unexpected response format:', response);
              this.transactions = [];
              this.error = 'Invalid response format from server';
            }
            this.loading = false;
          },
          error => {
            console.error('Error fetching transactions:', error);
            this.error = 'Failed to load transactions. Please try again later.';
            this.loading = false;
          }
        );
    } catch (error) {
      console.error('Error loading profile:', error);
      this.error = 'Failed to load user profile';
      this.loading = false;
    }
  }

  scroll() {
    window.scrollTo({ top: 100, behavior: 'smooth' });
  }

  formatDate(timestamp: any): string {
    if (!timestamp) return 'N/A';
    
    try {
      const date = new Date(parseInt(timestamp));
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (e) {
      return timestamp.toString();
    }
  }
}

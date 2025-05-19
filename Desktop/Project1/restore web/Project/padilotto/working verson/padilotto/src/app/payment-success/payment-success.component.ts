import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MoneymatterService } from '../services/moneymatter.service';
import { AuthService } from '../services/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-payment-success',
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.css']
})
export class PaymentSuccessComponent implements OnInit {
  status: string;
  txRef: string;
  transactionId: string;
  amount: number;
  loading = true;
  error: string;
  success = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private moneyService: MoneymatterService,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      console.log('=== PAYMENT SUCCESS PAGE INITIALIZED ===');
      console.log('Query parameters:', params);
      
      this.status = params['status'];
      this.txRef = params['tx_ref'];
      this.transactionId = params['transaction_id'];
      
      // Get amount from localStorage
      const storedAmount = localStorage.getItem('depositAmount');
      console.log('Stored amount from localStorage:', storedAmount);
      
      if (storedAmount) {
        this.amount = parseFloat(storedAmount);
        console.log('Parsed amount:', this.amount);
        this.verifyTransaction();
      } else {
        console.error('No deposit amount found in localStorage');
        this.error = 'Unable to verify payment amount';
        this.loading = false;
      }
    });
  }

  async verifyTransaction() {
    console.log('=== STARTING TRANSACTION VERIFICATION ===');
    console.log('Transaction details:', {
      status: this.status,
      txRef: this.txRef,
      transactionId: this.transactionId,
      amount: this.amount
    });

    try {
      // Validate payment status first
      if (this.status !== 'successful') {
        throw new Error('Payment was not successful');
      }

      // Get current user
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      console.log('Current user:', currentUser);

      if (!currentUser) {
        throw new Error('User not found');
      }

      // Update user's main balance first
      console.log('Updating main balance with amount:', this.amount);
      const updatedBalance = await this.moneyService.updateMainBalance(this.amount);
      console.log('Balance update response:', updatedBalance);

      if (!updatedBalance) {
        throw new Error('Failed to update balance');
      }

      // Create transaction record
      const timestamp = Date.now();
      const transDate = new Date().toISOString().split('T')[0];
      
      const transactionData = {
        user_id: currentUser.id,
        amount_involved: this.amount,
        transaction_type: 'deposit',
        acct_balance: updatedBalance,
        time_stamp: timestamp,
        trans_date: transDate,
        reference: this.txRef || this.transactionId,
        status: 'completed'
      };

      console.log('Creating transaction record:', transactionData);
      const transactionResult = await this.moneyService.createTransactionRecord(transactionData).toPromise();
      console.log('Transaction creation response:', transactionResult);

      if (!transactionResult || !transactionResult.success) {
        const errorMsg = transactionResult && transactionResult.msg ? transactionResult.msg : 'Failed to create transaction record';
        throw new Error(errorMsg);
      }

      // Update user profile with new balance
      const updatedUser = {
        ...currentUser,
        main_balance: updatedBalance
      };

      console.log('Updating user profile:', updatedUser);
      const profileResponse = await this.authService.updateUserProfile(currentUser.id, updatedUser).toPromise();
      console.log('Profile update response:', profileResponse);

      if (!profileResponse || profileResponse.error) {
        const errorMsg = profileResponse && profileResponse.error ? profileResponse.error : 'Failed to update user profile';
        throw new Error(errorMsg);
      }

      // Clear deposit amount from localStorage
      localStorage.removeItem('depositAmount');
      
      this.success = true;
      this.loading = false;
      console.log('=== TRANSACTION VERIFICATION COMPLETED SUCCESSFULLY ===');
    } catch (error) {
      console.error('=== TRANSACTION VERIFICATION ERROR ===');
      console.error('Error details:', error);
      this.error = error.message || 'Failed to verify transaction';
      this.loading = false;
    }
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  retryPayment() {
    this.router.navigate(['/payment']);
  }
} 
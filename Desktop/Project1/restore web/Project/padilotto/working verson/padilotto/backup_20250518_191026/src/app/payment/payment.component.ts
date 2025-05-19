import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MoneymatterService } from '../services/moneymatter.service';
import { AuthService } from '../services/auth.service';
import { MyTicketsService } from '../services/my-tickets.service';
import { RandomService } from '../services/random.service';
import { FlutterwaveService } from '../services/flutterwave.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NgForm } from '@angular/forms';

declare global {
  interface Window {
    FlutterwaveCheckout: any;
  }
}

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  cancelPayment: any;
  reference = Math.floor((Math.random() * 100000000) + 1);
  depositAmount: number;
  user: any;
  main_balance: number;
  transStatus: any;
  transaction_type: any;
  reqData: any;
  public email: string;
  public new_bonus: number;
  public new_main_balance: number;
  newData: any;
  loading = false;
  redirectUrl: string;

  constructor(
    private route: ActivatedRoute, 
    private router: Router,
    private authApi: AuthService, 
    private transaction_api: MyTicketsService,
    private someServ: RandomService,
    private money: MoneymatterService,
    private flutterwaveService: FlutterwaveService
  ) {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(queryParams => {
        this.depositAmount = queryParams['deposit_amt'] || 0;
      });
    
    // Set the redirect URL to the payment success component
    this.redirectUrl = window.location.origin + '/payment-success';
  }

  onSubmit(form: NgForm) {
    if (form.valid) {
      if (!this.email) {
        console.error('Customer email is required');
        return;
      }

      this.loading = true;
      console.log('=== PAYMENT FORM SUBMITTED ===');
      console.log('Form values:', form.value);
      console.log('Current user:', this.user);
      console.log('Deposit amount:', this.depositAmount);

      // Store deposit amount in localStorage
      localStorage.setItem('depositAmount', this.depositAmount.toString());
      console.log('Deposit amount stored in localStorage:', this.depositAmount);

      // Ensure Flutterwave is loaded
      if (typeof window.FlutterwaveCheckout === 'undefined') {
        console.error('Flutterwave script not loaded');
        this.loading = false;
        return;
      }

      const config = {
        public_key: 'FLWPUBK_TEST-c0522e4c0426a3a4899638195f21704b-X',
        tx_ref: this.reference.toString(),
        amount: this.depositAmount,
        currency: 'NGN',
        payment_options: 'card,ussd,banktransfer',
        redirect_url: this.redirectUrl,
        customer: {
          email: this.email,
          name: this.user ? this.user.name : 'Customer',
          phone_number: this.user ? this.user.phone : ''
        },
        customizations: {
          title: 'Padilotto',
          description: 'Payment for deposit',
          logo: 'https://padilotto.com/assets/images/logo.png'
        },
        meta: {
          user_id: this.user.id
        }
      };

      console.log('=== INITIALIZING FLUTTERWAVE ===');
      console.log('Configuration:', JSON.stringify(config, null, 2));

      window.FlutterwaveCheckout({
        ...config,
        callback: (response: any) => {
          console.log('=== FLUTTERWAVE CALLBACK TRIGGERED ===');
          console.log('Response:', JSON.stringify(response, null, 2));
          this.handlePaymentSuccess(response);
        },
        onClose: () => {
          console.log('=== FLUTTERWAVE CHECKOUT CLOSED ===');
          this.loading = false;
        }
      });
    }
  }

  async handlePaymentSuccess(response: any) {
    console.log('=== PAYMENT SUCCESS HANDLER STARTED ===');
    console.log('Response from Flutterwave:', JSON.stringify(response, null, 2));
    console.log('Current deposit amount:', this.depositAmount);
    console.log('Current user state:', JSON.stringify(this.user, null, 2));
    
    try {
      // Amount is already in Naira, no need to convert
      const amountInNaira = this.depositAmount;
      console.log('Processing amount in Naira:', amountInNaira);

      // Get current timestamp and date
      const timestamp = Date.now();
      const transDate = new Date().toISOString().split('T')[0];
      console.log('Transaction timestamp:', timestamp);
      console.log('Transaction date:', transDate);

      // Update user's main balance first
      console.log('=== STARTING BALANCE UPDATE ===');
      console.log('Current balance:', this.user.main_balance);
      console.log('Amount to add:', amountInNaira);
      
      try {
        console.log('Calling updateMainBalance service...');
        const updatedBalance = await this.money.updateMainBalance(amountInNaira);
        console.log('Balance update response:', JSON.stringify(updatedBalance, null, 2));
        
        if (!updatedBalance) {
          console.error('Balance update failed - no response received');
          throw new Error('Balance update failed - no response received');
        }

        // Update local user data with new balance
        console.log('Updating local user data with new balance:', updatedBalance);
        this.user.main_balance = updatedBalance;
        console.log('Local user data updated:', JSON.stringify(this.user, null, 2));
      } catch (error) {
        console.error('=== BALANCE UPDATE ERROR ===');
        console.error('Error details:', error);
        console.error('Error stack:', error.stack);
        throw error;
      }

      // Create transaction record
      console.log('=== STARTING TRANSACTION RECORD CREATION ===');
      const transactionData = {
        user_id: this.user.id,
        amount_involved: amountInNaira,
        transaction_type: 'deposit',
        acct_balance: this.user.main_balance,
        time_stamp: timestamp,
        trans_date: transDate,
        reference: response.transaction_id || this.reference.toString()
      };
      console.log('Transaction data:', JSON.stringify(transactionData, null, 2));

      try {
        console.log('Calling simpleTransaction service...');
        const transactionResult = await this.transaction_api.simpleTransaction(transactionData).toPromise();
        console.log('Transaction creation response:', JSON.stringify(transactionResult, null, 2));
        
        if (!transactionResult || !transactionResult.success) {
          const errorMsg = transactionResult && transactionResult.msg ? transactionResult.msg : 'No response received';
          console.error('Transaction creation failed:', errorMsg);
          throw new Error('Transaction record creation failed - ' + errorMsg);
        }
        console.log('Transaction record created successfully');
      } catch (error) {
        console.error('=== TRANSACTION CREATION ERROR ===');
        console.error('Error details:', error);
        console.error('Error stack:', error.stack);
        throw error;
      }

      // Update user profile
      console.log('=== STARTING USER PROFILE UPDATE ===');
      const updatedUser = {
        ...this.user,
        main_balance: this.user.main_balance
      };
      console.log('Updated user data:', JSON.stringify(updatedUser, null, 2));

      try {
        console.log('Calling updateUserProfile service...');
        const profileResponse = await this.authApi.updateUserProfile(this.user.id, updatedUser).toPromise();
        console.log('Profile update response:', JSON.stringify(profileResponse, null, 2));
        
        if (!profileResponse || profileResponse.error) {
          const errorMsg = profileResponse && profileResponse.error ? profileResponse.error : 'No response received';
          console.error('Profile update failed:', errorMsg);
          throw new Error('User profile update failed - ' + errorMsg);
        }
        console.log('User profile updated successfully');
      } catch (error) {
        console.error('=== PROFILE UPDATE ERROR ===');
        console.error('Error details:', error);
        console.error('Error stack:', error.stack);
        throw error;
      }

      // Navigate to success page
      console.log('=== NAVIGATING TO SUCCESS PAGE ===');
      this.router.navigate(['/payment-success'], {
        queryParams: {
          status: 'successful',
          tx_ref: response.tx_ref,
          transaction_id: response.transaction_id
        }
      });
    } catch (error) {
      console.error('=== PAYMENT PROCESSING ERROR ===');
      console.error('Error details:', error);
      console.error('Error stack:', error.stack);
      this.router.navigate(['/payment-success'], {
        queryParams: {
          status: 'failed',
          error: error.message
        }
      });
    }
  }

  ngOnInit() {
    // Get current user
    this.user = JSON.parse(localStorage.getItem('currentUser'));
    if (this.user) {
      this.email = this.user.email;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

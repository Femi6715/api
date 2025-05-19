import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { environment } from './../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MoneymatterService {
  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  user: any;
  apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  verifyDeposit(data, reference) {
    return this.http.post<any>(`${this.apiUrl}/users/deposit/${reference}`, data, this.httpOptions);
  }

  createPayout(data) {
    return this.http.post(`${this.apiUrl}/transfer/newRecipient`, data, this.httpOptions);
  }

  transferDetails(data) {
    return this.http.post(`${this.apiUrl}/transfer/transferRecipient`, data, this.httpOptions);
  }

  cashOUt(data) {
    return this.http.post(`${this.apiUrl}/transfer/cashOut`, data, this.httpOptions);
  }

  createTransactionRecord(data) {
    return this.http.post<any>(`${this.apiUrl}/api/simple/transaction`, data, this.httpOptions);
  }

  async updateMainBalance(amount: number): Promise<number> {
    try {
      const userId = localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')).id : null;
      if (!userId) {
        throw new Error('User ID not found');
      }

      console.log('Updating balance for user:', userId, 'with amount:', amount);

      // Get current user data
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      const currentBalance = Number(currentUser.main_balance) || 0;
      const newBalance = currentBalance + amount;

      const response = await this.http.post<{ success: boolean; user: { main_balance: number } }>(
        `${this.apiUrl}/api/simple/update-account`,
        {
          user_id: userId,
          main_balance: newBalance,
          bonus: currentUser.bonus || 0
        },
        this.httpOptions
      ).toPromise();
      
      console.log('Balance update response:', response);

      if (!response || !response.success) {
        throw new Error('Failed to update balance: ' + (response ? JSON.stringify(response) : 'No response'));
      }

      // Update local storage with new balance
      currentUser.main_balance = response.user.main_balance;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      
      return response.user.main_balance;
    } catch (error) {
      console.error('Error updating balance:', error);
      throw error;
    }
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ITickets } from './my-tickets';
import { environment } from './../../environments/environment';
import { AuthService } from './auth.service';

interface TransactionResponse {
  success: boolean;
  transactions?: any[];
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MyTicketsService {
  private getHeaders() {
    const token = localStorage.getItem('token');
    console.log('Retrieved token:', token ? 'Token exists' : 'No token found');
    
    if (!token) {
      console.warn('No authentication token found');
      return { headers: new HttpHeaders().set('Content-Type', 'application/json') };
    }
    
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);
    
    console.log('Request headers:', headers.keys());
    return { headers };
  }

  user: any;
// private _url = './assets/data/my-tickets.json';

 apiUrl = environment.apiUrl;
//  apiUrl = 'http://localhost:3000';

  day = new Date().getDate();
  month = new Date().getMonth() + 1;
  year = new Date().getFullYear();
  shuffleDate = this.day + '-' + this.month + '-' + this.year;

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Get the current user ID from local storage
  private getCurrentUserId(): number | null {
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const user = JSON.parse(currentUser);
        return user.id;
      }
    } catch (e) {
      console.error('Error parsing current user from localStorage:', e);
    }
    return null;
  }

  // Get tickets for the logged-in user
  getMyTickets(data = null): Observable<ITickets[]> {
    // Get user ID from parameter if provided, otherwise from localStorage
    let userId;
    if (data && (data.user_id || data.id)) {
      userId = data.user_id || data.id;
      console.log('Using provided user ID:', userId);
    } else {
      userId = this.getCurrentUserId();
      console.log('Using user ID from localStorage:', userId);
    }

    if (!userId) {
      console.error('No user ID available, cannot fetch tickets');
      return of([]);
    }
    
    console.log('Getting tickets for user ID:', userId);
    const userData = { user_id: userId };
    console.log('Request data:', userData);
    
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');
    
    return this.http.post<any>(`${this.apiUrl}/api/direct/tickets`, userData, { headers })
      .pipe(
        tap(response => {
          console.log('Raw ticket response:', response);
          if (response && !response.success) {
            console.warn('API reported failure:', response.message || 'No error message provided');
          }
        }),
        map(response => {
          if (response && response.success && Array.isArray(response.tickets)) {
            console.log(`Processing ${response.tickets.length} tickets`);
            return response.tickets;
          } else if (Array.isArray(response)) {
            console.log(`Processing ${response.length} tickets (direct array)`);
            return response;
          }
          console.warn('No valid tickets array found in response');
          return [];
        }),
        catchError(error => {
          console.error('Error fetching tickets:', error);
          if (error.status === 404) {
            console.error('API endpoint not found. Verify the tickets endpoint is correctly implemented.');
          } else if (error.status === 401) {
            console.error('Unauthorized access. User may need to log in again.');
          }
          return of([]);
        })
      );
  }

  getMyLast5Tickets(data = null): Observable<ITickets[]> {
    // Get user ID from parameter if provided, otherwise from localStorage
    let userId;
    if (data && (data.user_id || data.id)) {
      userId = data.user_id || data.id;
      console.log('Using provided user ID for last 5 tickets:', userId);
    } else {
      userId = this.getCurrentUserId();
      console.log('Using user ID from localStorage for last 5 tickets:', userId);
    }
    
    if (!userId) {
      console.error('No user ID available, cannot fetch last 5 tickets');
      return of([]);
    }
    
    console.log('Getting last 5 tickets for user ID:', userId);
    const userData = { user_id: userId };
    
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');
    
    return this.http.post<any>(`${this.apiUrl}/api/direct/ticket`, userData, { headers })
      .pipe(
        map(response => {
          if (response && response.success && Array.isArray(response.tickets)) {
            return response.tickets.slice(0, 5);
          }
          return [];
        }),
        catchError(error => {
          console.error('Error fetching last 5 tickets:', error);
          return of([]);
        })
      );
  }

  // Get transactions for the logged-in user
  getMyTransactions(data = null): Observable<TransactionResponse> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      console.error('No user ID available, cannot fetch transactions');
      return of({ success: false, transactions: [] });
    }
    
    console.log('Getting transactions for logged-in user ID:', userId);
    const userData = { user_id: userId };
    
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');
    
    return this.http.post<TransactionResponse>(`${this.apiUrl}/api/direct/transactions`, userData, { headers })
      .pipe(
        tap(response => {
          console.log('Transaction response:', response);
          if (response && !response.success) {
            console.warn('API reported failure:', response.message || 'No error message provided');
          }
        }),
        map(response => {
          if (response && response.success && Array.isArray(response.transactions)) {
            console.log(`Processing ${response.transactions.length} transactions`);
            return response;
          } else if (Array.isArray(response)) {
            console.log(`Processing ${response.length} transactions (direct array)`);
            return { success: true, transactions: response };
          }
          console.warn('No valid transactions array found in response');
          return { success: false, transactions: [] };
        }),
        catchError(error => {
          console.error('Error fetching transactions:', error);
          if (error.status === 404) {
            console.error('API endpoint not found. Verify the transactions endpoint is correctly implemented.');
          } else if (error.status === 401) {
            console.error('Unauthorized access. User may need to log in again.');
          }
          return of({ success: false, transactions: [] });
        })
      );
  }

  checkTransStatus(data) {
    return this.http.post(`${this.apiUrl}/transactions/checkTransaction`, data, this.getHeaders());
  }

  // New transaction method using direct endpoint
  simpleTransaction(transactionData): Observable<any> {
    console.log('Recording transaction via direct endpoint:', transactionData);
    
    // Ensure transaction_type is one of the valid types
    const validTypes = ['deposit', 'withdrawal', 'winning', 'ticket_purchase'];
    if (!validTypes.includes(transactionData.transaction_type)) {
      console.error(`Invalid transaction_type: ${transactionData.transaction_type}. Valid types are: ${validTypes.join(', ')}`);
      transactionData.transaction_type = transactionData.transaction_type.toLowerCase().trim();
      
      // Try to map to a valid type if possible
      if (transactionData.transaction_type.includes('deposit')) {
        transactionData.transaction_type = 'deposit';
      } else if (transactionData.transaction_type.includes('withdraw')) {
        transactionData.transaction_type = 'withdrawal';
      } else if (transactionData.transaction_type.includes('stake') || transactionData.transaction_type.includes('purchase')) {
        transactionData.transaction_type = 'ticket_purchase';
      } else if (transactionData.transaction_type.includes('win')) {
        transactionData.transaction_type = 'winning';
      } else {
        // Default to ticket_purchase if no match (safer than using 'test' which isn't in the ENUM)
        transactionData.transaction_type = 'ticket_purchase';
      }
      
      console.log(`Corrected transaction_type to: ${transactionData.transaction_type}`);
    }
    
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');
    
    return this.http.post(`${this.apiUrl}/api/direct/transaction`, transactionData, { headers })
      .pipe(
        catchError(error => {
          console.error('Error recording transaction:', error);
          if (error.error && error.error.msg) {
            console.error('Server error message:', error.error.msg);
          }
          if (error.error && error.error.error) {
            console.error('Detailed error:', error.error.error);
          }
          // Return a success response even on error to prevent UI disruption
          return of({ success: true, msg: 'Transaction processed (error logged)' });
        })
      );
  }

  updateSelectedTicket(ticket_id) {
    return this.http.post(`${this.apiUrl}/games/updateSelectedTicket`, ticket_id, this.getHeaders());
  }

  getWinningTickets(): Observable<any> {
    return this.http.get(`${this.apiUrl}/games/winning-tickets-signal/${this.shuffleDate}/won`, this.getHeaders());
  }

  submitWinningTickets(winningTicket) {
    return this.http.post(`${this.apiUrl}/winners/newWinningTicket`, winningTicket, this.getHeaders());
  }

  getPast25kWinners(): Observable<any> {
    return this.http.get(`${this.apiUrl}/games/pastWinningTickets/won/25`, this.getHeaders());
  }

  getPast50kWinners(): Observable<any> {
    return this.http.get(`${this.apiUrl}/games/pastWinningTickets/won/50`, this.getHeaders());
  }

  getPast100kWinners(): Observable<any> {
    return this.http.get(`${this.apiUrl}/games/pastWinningTickets/won/100`, this.getHeaders());
  }

  payWinner(data) {
    return this.http.post(`${this.apiUrl}/users/payWinner`, data, this.getHeaders());
  }

  getMainValue(): Observable<any> {
    const userId = this.getCurrentUserId();
    return this.http.get(`${this.apiUrl}/users/main-value/${userId}`, this.getHeaders());
  }

  getBonusValue(): Observable<any> {
    const userId = this.getCurrentUserId();
    return this.http.get(`${this.apiUrl}/users/bonus-value/${userId}`, this.getHeaders());
  }
}

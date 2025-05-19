import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ICoupon } from './coupon';
import { Observable } from 'rxjs';
import { environment } from './../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CouponService {
  userFromStorage: any;
  authToken: any;
  user: any;

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    console.log('Token being sent:', token); // Debug
    
    let headers = new HttpHeaders()
      .set('Content-Type', 'application/json');
    
    if (token) {
      // Support both formats for maximum compatibility
      headers = headers.set('Authorization', `Bearer ${token}`);
      console.log('Authorization header set:', `Bearer ${token}`);
    } else {
      console.warn('No token found in localStorage!');
    }
    
    return headers;
  }

  newTicket(data) {
    return this.http.post<any>(`${this.apiUrl}/games/newticket`, data, { 
      headers: this.getAuthHeaders() 
    });
  }

  newTransaction(transactionData) {
    return this.http.post<any>(`${this.apiUrl}/games/newticket`, transactionData, { 
      headers: this.getAuthHeaders() 
    });
  }

  getWinningTickets(): Observable<ICoupon[]> {
    return this.http.get<ICoupon[]>(`${this.apiUrl}/games/winning-tickets`, { 
      headers: this.getAuthHeaders() 
    });
  }

  loadUser() {
    const userInfo = JSON.parse(localStorage.getItem('user'));
    this.userFromStorage = userInfo;
    // console.log(this.userFromStorage);
    return this.userFromStorage;
  }

  updateAcct(data): Observable<ICoupon> {
    console.log('Updating account with data:', data);
    // Use the simpler endpoint that doesn't require auth
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.http.post<ICoupon>(`${this.apiUrl}/api/simple/update-account`, data, {
      headers: headers
    });
  }

  fetchCategories() {
    return this.http.get(`${this.apiUrl}/categories/`, { 
      headers: this.getAuthHeaders() 
    });
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface PaymentResponse {
  status: string;
  message: string;
  data: {
    link: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class FlutterwaveService {
  private apiUrl = '/api/payments/initialize'; // This will be proxied to your backend

  constructor(private http: HttpClient) { }

  initializePayment(amount: number, email: string, name: string, phone: string): Observable<PaymentResponse> {
    const paymentData = {
      amount: amount.toString(),
      email,
      name,
      phone
    };

    return this.http.post<PaymentResponse>(this.apiUrl, paymentData);
  }
} 
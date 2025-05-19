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
}

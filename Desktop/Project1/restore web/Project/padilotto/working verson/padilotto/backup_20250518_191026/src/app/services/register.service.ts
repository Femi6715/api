import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from './../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RegisterService {
  apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  registerUser(data) {
    return this.http.post<any>(`${this.apiUrl}/users/register`, data);
  }
}

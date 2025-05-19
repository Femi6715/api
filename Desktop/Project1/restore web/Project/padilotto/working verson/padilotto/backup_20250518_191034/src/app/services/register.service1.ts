import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from './../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RegisterService {
  apiUrl = environment.apiUrl;

  // apiUrl = 'http://localhost:3000/users';

  constructor(private http: HttpClient) {}

  registerUser(data) {
    return this.http.post<any>(`${this.apiUrl}/admin/register`, data);
  }
}

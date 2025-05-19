import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private apiUrl = 'http://localhost:8080';

  constructor(private http: HttpClient) {}

  // User operations
  async getUserByUsername(username: string): Promise<any> {
    try {
      console.log('Fetching user with username:', username);
      const response = await this.http.get(`${this.apiUrl}/users/username/${username}`).toPromise();
      console.log('User fetch response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching user by username:', error);
      if (error.status === 404) {
        console.log('User not found in database');
        return null;
      }
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<any> {
    return this.http.get(`${this.apiUrl}/users/email/${email}`).toPromise();
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<any> {
    return this.http.get(`${this.apiUrl}/users/phone/${phoneNumber}`).toPromise();
  }

  async getUserById(id: string): Promise<any> {
    try {
      console.log('Fetching user with ID:', id);
      const response = await this.http.get(`${this.apiUrl}/users/${id}`).toPromise();
      console.log('User fetch response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      if (error.status === 404) {
        console.log('User not found in database');
        return null;
      }
      throw error;
    }
  }

  async createUser(username: string, email: string, passwordHash: string): Promise<any> {
    return this.http.post(`${this.apiUrl}/users`, {
      username,
      email,
      password_hash: passwordHash
    }).toPromise();
  }

  async updateUser(id: string, data: any): Promise<any> {
    return this.http.put(`${this.apiUrl}/users/${id}`, data).toPromise();
  }

  // Ticket operations
  async createTicket(userId: string, ticketNumber: string, price: number): Promise<any> {
    // Implementation needed
    throw new Error('Method not implemented');
  }

  async getTicketsByUserId(userId: string): Promise<any[]> {
    // Implementation needed
    throw new Error('Method not implemented');
  }

  // Transaction operations
  async createTransaction(userId: string, type: string, amount: number): Promise<any> {
    // Implementation needed
    throw new Error('Method not implemented');
  }

  async getTransactionsByUserId(userId: string): Promise<any[]> {
    // Implementation needed
    throw new Error('Method not implemented');
  }

  // Winning ticket operations
  async createWinningTicket(ticketId: string, prizeAmount: number): Promise<any> {
    // Implementation needed
    throw new Error('Method not implemented');
  }

  async getWinningTicketsByUserId(userId: string): Promise<any[]> {
    // Implementation needed
    throw new Error('Method not implemented');
  }

  // Bonus operations
  async createBonus(userId: string, amount: number, type: string, expiresAt: Date): Promise<any> {
    // Implementation needed
    throw new Error('Method not implemented');
  }

  async getActiveBonusesByUserId(userId: string): Promise<any[]> {
    // Implementation needed
    throw new Error('Method not implemented');
  }
} 
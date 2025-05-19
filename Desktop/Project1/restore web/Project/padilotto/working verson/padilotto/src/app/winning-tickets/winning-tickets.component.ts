import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { NgxLoadingModule } from 'ngx-loading';

interface Ticket {
  ticket_id: string;
  draw_date: string;
  draw_time: string;
  game_id: string;
  stake_amt: string;
  potential_winning: string;
  ticket_status: string;
}

@Component({
  selector: 'app-winning-tickets',
  templateUrl: './winning-tickets.component.html',
  styleUrls: ['./winning-tickets.component.css']
})
export class WinningTicketsComponent implements OnInit {
  loading = false;
  error: string | null = null;
  term: string = '';
  
  // Menu signals
  menu1Signal: boolean = true;
  menu2Signal: boolean = false;
  menu3Signal: boolean = false;

  // Tickets arrays
  recent25kTickets: Ticket[] = [];
  recent50kTickets: Ticket[] = [];
  recent100kTickets: Ticket[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.loading = true;
    this.error = null;

    this.http.get<any>(`${environment.apiUrl}/api/tickets/all`)
      .subscribe({
        next: (response) => {
          if (response.success && Array.isArray(response.tickets)) {
            // Sort tickets by stake amount
            const tickets = response.tickets.sort((a: any, b: any) => {
              return parseFloat(b.stake_amt) - parseFloat(a.stake_amt);
            });

            // Categorize tickets by stake amount
            this.recent25kTickets = tickets.filter((ticket: any) => 
              parseFloat(ticket.stake_amt) === 25
            );
            this.recent50kTickets = tickets.filter((ticket: any) => 
              parseFloat(ticket.stake_amt) === 50
            );
            this.recent100kTickets = tickets.filter((ticket: any) => 
              parseFloat(ticket.stake_amt) === 100
            );

            console.log('25k tickets:', this.recent25kTickets);
            console.log('50k tickets:', this.recent50kTickets);
            console.log('100k tickets:', this.recent100kTickets);
          } else {
            this.error = 'Invalid response format from server';
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Error fetching tickets:', err);
          this.error = 'Failed to load tickets. Please try again later.';
          this.loading = false;
        }
      });
  }

  menu1(): void {
    this.menu1Signal = true;
    this.menu2Signal = false;
    this.menu3Signal = false;
  }

  menu2(): void {
    this.menu1Signal = false;
    this.menu2Signal = true;
    this.menu3Signal = false;
  }

  menu3(): void {
    this.menu1Signal = false;
    this.menu2Signal = false;
    this.menu3Signal = true;
  }
} 
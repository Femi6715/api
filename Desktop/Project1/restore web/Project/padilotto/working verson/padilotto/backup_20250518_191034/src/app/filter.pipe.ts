import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {

  transform(my_tickets: any, term: any): any {
    
    // check if search term is undefined
    if (term === undefined) { return my_tickets; }

    // check if search term exists
    return my_tickets.filter(function(each_ticket) {
      return each_ticket.ticket_id.toLowerCase().includes(term.toLowerCase());
    });
   
  }

}

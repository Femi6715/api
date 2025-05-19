import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import * as moment from 'moment';
import { RandomService } from '../services/random.service';

@Component({
  selector: 'app-body',
  templateUrl: './body.component.html',
  styleUrls: ['./body.component.css']
})
export class BodyComponent implements OnInit {

  loggedInStatus: any;
  nearestDrawId: any;
  testing: any;
  final_list: any;
  // endOfTheMonth = moment().endOf('month').format('dddd, MMMM Do');
  endOfTheMonth = this.lastFriday().format('dddd, MMMM Do');
  monthlyCountDown = this.lastFriday().format('YYYY-M-DD') + ' 18:00:00';

  firstDraw = this.drawTimer(12, 'dddd, MMMM Do');
  secondDraw = this.drawTimer(19, 'dddd, MMMM Do');
  thirdDraw = this.lastFriday().format('dddd, MMMM Do');
  // thirdDraw = this.drawTimer(5, 'dddd, MMMM Do');


  categoryToday = [

    {day: 'Monday', category: ['25k', '50k', '100k', '200k']}

  ];


  drawTimer(dayINeed, formatTpye) {
    const today = moment().isoWeekday();
    if (today <= dayINeed) {
      return (moment().isoWeekday(dayINeed).format(formatTpye));
    } else {
      return (moment().add(1, 'weeks').isoWeekday(dayINeed).format(formatTpye));
    }
  }


  constructor(private authService: AuthService, private someServ: RandomService) {
    const now = moment().format('DD');
    const newfirstDraw = this.drawTimer(12, 'DD');
    const newsecondDraw = this.lastFriday().format('DD');
    // const newthirdDraw = this.drawTimer(5, 'DD');
    const test1 = (parseInt(newfirstDraw, 10) - parseInt(now, 10));
    const test2 = (parseInt(newsecondDraw, 10) - parseInt(now, 10));
    // const test3 = (parseInt(newthirdDraw, 10) - parseInt(now, 10));

    this.testing = [];
    if (test1 < test2) {
        this.final_list = [
          {
          draw_date: this.firstDraw,
          draw_id: 1
          },
          {
            draw_date: this.secondDraw,
            draw_id: 3
          }
      ];
      this.testing.push(this.final_list);
    } else if (test2 < test1) {
        this.final_list = [
          {
          draw_date: this.secondDraw,
          draw_id: 3
          },
          {
            draw_date: this.firstDraw,
            draw_id: 1
          }
      ];

      this.testing.push(this.final_list);
    } else {
      this.final_list = [];
      this.testing.push(this.final_list);
    }
// console.log(this.final_list);
  }

  lastFriday() {
    var lastDay = moment().endOf('month');
    if (lastDay.day() >= 5)
     var sub = lastDay.day() - 5;
    else
     var sub = lastDay.day() + 2;
    const lastFri = lastDay.subtract(sub, 'days');
    return lastFri;
  } 

  ngOnInit() {
    // this.loggedInStatus = this.authService.loggedIn();
    this.someServ.loginStatus$.subscribe(ts => this.loggedInStatus = ts);
  }

}

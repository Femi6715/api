import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CountdownService {

  signalStatus = false;
  currentDate = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
  currentDay = new Date(new Date().getTime());
  day = this.currentDay.getDate();
  month = this.currentDay.getMonth() + 1;
  year = this.currentDay.getFullYear();

  today = this.year + '-' + this.month + '-' + this.day;
  now = Date.now();

  tomorrowday: number = this.currentDate.getDate();
  tomorrowmonth = this.currentDate.getMonth() + 1;
  tomorrowyear = this.currentDate.getFullYear();
  another_tomorrow = this.tomorrowyear + '-' + this.tomorrowmonth + '-' + this.tomorrowday;

  constructor() { }


}

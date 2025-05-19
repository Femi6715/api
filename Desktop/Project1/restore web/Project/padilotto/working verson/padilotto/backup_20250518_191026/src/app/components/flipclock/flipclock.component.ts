import { Component, ElementRef, OnInit, Renderer2, ViewChild, AfterViewInit, Inject, Input } from '@angular/core';
/* import * as jquery from 'jquery';
import { DOCUMENT } from '@angular/platform-browser';
import * as FlipClock from 'flipclock'; */

@Component({
  selector: 'app-flipclock',
  templateUrl: './flipclock.component.html',
  styleUrls: ['./flipclock.component.css']
})
export class FlipclockComponent implements AfterViewInit {
  @ViewChild('clock') clock: ElementRef;
  @Input() time =  (new Date().getTime() / 1000) + (86400 * 58) + 1;
  constructor(public elementRef: ElementRef,
    private renderer: Renderer2) { }

  ngAfterViewInit() {
    new FlipDown(this.time, 'clock', {
      theme: 'orange'
    }).start();
    // window.clock.time.time = 7200*24*3
    // console.log(clock.time.time);
    // If you have TS issues here add a cast like (<any>$(this.elementRef).FlipClock

  }
}

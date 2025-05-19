import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WinningTicketsComponent } from './winning-tickets.component';

describe('WinningTicketsComponent', () => {
  let component: WinningTicketsComponent;
  let fixture: ComponentFixture<WinningTicketsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WinningTicketsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WinningTicketsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MonthlyBonusesComponent } from './monthly-bonuses.component';

describe('MonthlyBonusesComponent', () => {
  let component: MonthlyBonusesComponent;
  let fixture: ComponentFixture<MonthlyBonusesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MonthlyBonusesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MonthlyBonusesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

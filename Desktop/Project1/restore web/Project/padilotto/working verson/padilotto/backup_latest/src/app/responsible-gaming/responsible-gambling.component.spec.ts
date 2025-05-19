import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GamblingComponent } from './responsible-gambling.component';

describe('AboutComponent', () => {
  let component: GamblingComponent;
  let fixture: ComponentFixture<GamblingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GamblingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GamblingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResponsibleComponent } from './responsible.component';

describe('ResponsibleComponent', () => {
  let component: ResponsibleComponent;
  let fixture: ComponentFixture<ResponsibleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResponsibleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResponsibleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

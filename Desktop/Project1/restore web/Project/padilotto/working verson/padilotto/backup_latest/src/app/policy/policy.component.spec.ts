import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Policy } from './policy.component';

describe('Policy', () => {
  let component: Policy;
  let fixture: ComponentFixture<Policy>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Policy ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Policy);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

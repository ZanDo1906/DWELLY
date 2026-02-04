import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentMember } from './payment-member';

describe('PaymentMember', () => {
  let component: PaymentMember;
  let fixture: ComponentFixture<PaymentMember>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentMember]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentMember);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentNonMember } from './payment-non-member';

describe('PaymentNonMember', () => {
  let component: PaymentNonMember;
  let fixture: ComponentFixture<PaymentNonMember>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentNonMember]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentNonMember);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

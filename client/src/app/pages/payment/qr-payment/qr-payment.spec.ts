import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QRPayment } from './qr-payment';

describe('QRPayment', () => {
  let component: QRPayment;
  let fixture: ComponentFixture<QRPayment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QRPayment]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QRPayment);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

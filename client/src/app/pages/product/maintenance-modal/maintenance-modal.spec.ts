import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaintenanceModal } from './maintenance-modal';

describe('MaintenanceModal', () => {
  let component: MaintenanceModal;
  let fixture: ComponentFixture<MaintenanceModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaintenanceModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MaintenanceModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

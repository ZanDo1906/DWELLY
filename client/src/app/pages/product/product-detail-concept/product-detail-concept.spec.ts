import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductDetailConcept } from './product-detail-concept';

describe('ProductDetailConcept', () => {
  let component: ProductDetailConcept;
  let fixture: ComponentFixture<ProductDetailConcept>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductDetailConcept]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductDetailConcept);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

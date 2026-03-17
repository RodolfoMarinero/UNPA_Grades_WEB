import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodigoBarras } from './codigo-barras';

describe('CodigoBarras', () => {
  let component: CodigoBarras;
  let fixture: ComponentFixture<CodigoBarras>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodigoBarras]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CodigoBarras);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

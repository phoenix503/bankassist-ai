import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisputeDetailsComponent } from './dispute-details.component';

describe('DisputeDetailsComponent', () => {
  let component: DisputeDetailsComponent;
  let fixture: ComponentFixture<DisputeDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisputeDetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DisputeDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

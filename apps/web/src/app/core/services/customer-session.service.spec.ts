import { TestBed } from '@angular/core/testing';

import { CustomerSessionService } from './customer-session.service';

describe('CustomerSessionService', () => {
  let service: CustomerSessionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CustomerSessionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

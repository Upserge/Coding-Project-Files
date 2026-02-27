import { TestBed } from '@angular/core/testing';

import { HHservice } from './hhservice';

describe('HHservice', () => {
  let service: HHservice;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HHservice);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

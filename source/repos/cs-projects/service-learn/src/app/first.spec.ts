import { TestBed } from '@angular/core/testing';

import { First } from './first';

describe('First', () => {
  let service: First;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(First);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed, inject } from '@angular/core/testing';

import { RootService } from './root.service';

describe('RootService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RootService]
    });
  });

  it('should ...', inject([RootService], (service: RootService) => {
    expect(service).toBeTruthy();
  }));
});

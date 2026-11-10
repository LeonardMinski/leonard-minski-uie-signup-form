import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SignUpRequest } from '../models/sign-up.model';
import { SignUpApi } from './sign-up-api';

describe('SignUpApi', () => {
  let service: SignUpApi;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(SignUpApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('posts the sign-up payload to the configured endpoint and completes successfully', () => {
    const payload: SignUpRequest = {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
    };
    let completed = false;

    service.submitSignUp(payload).subscribe({
      complete: () => {
        completed = true;
      },
    });

    const request = httpTesting.expectOne('/api/sign-up');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);

    request.flush(null);

    expect(completed).toBe(true);
  });

  it('propagates HTTP errors to the caller', () => {
    let receivedError: unknown;

    service
      .submitSignUp({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
      })
      .subscribe({
        error: (error: unknown) => {
          receivedError = error;
        },
      });

    httpTesting
      .expectOne('/api/sign-up')
      .flush({ message: 'Unavailable' }, { status: 503, statusText: 'Service Unavailable' });

    expect(receivedError).toBeInstanceOf(HttpErrorResponse);
    expect(receivedError).toMatchObject({ status: 503 });
  });
});

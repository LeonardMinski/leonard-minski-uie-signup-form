import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { signUpMockInterceptor } from './sign-up.mock';

describe('signUpMockInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([signUpMockInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    vi.useRealTimers();
  });

  it('returns HTTP 200 with the mock response for a matching POST', () => {
    let response: { status: number; body: unknown } | undefined;

    http
      .post<unknown>(
        '/api/sign-up',
        {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
        },
        { observe: 'response' },
      )
      .subscribe((result) => {
        response = result;
      });

    httpTesting.expectNone('/api/sign-up');
    expect(response).toBeUndefined();

    vi.advanceTimersByTime(500);

    expect(response?.status).toBe(200);
    expect(response?.body).toBeNull();
  });

  it('passes non-matching requests through to the next handler', () => {
    let response: unknown;

    http.get('/api/other').subscribe((result) => {
      response = result;
    });

    const request = httpTesting.expectOne('/api/other');
    expect(request.request.method).toBe('GET');
    request.flush({ ok: true });

    expect(response).toEqual({ ok: true });
  });
});

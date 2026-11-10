import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
import { SignUpRequest } from './models/sign-up.model';
import { SignUpApi } from './services/sign-up-api';
import { SignUp } from './sign-up';

describe('SignUp', () => {
  let component: SignUp;
  let fixture: ComponentFixture<SignUp>;
  let submittedPayloads: SignUpRequest[];
  let response$: Observable<void>;

  beforeEach(async () => {
    submittedPayloads = [];
    response$ = of(undefined);

    await TestBed.configureTestingModule({
      imports: [SignUp],
      providers: [
        {
          provide: SignUpApi,
          useValue: {
            submitSignUp: (payload: SignUpRequest) => {
              submittedPayloads.push(payload);
              return response$;
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SignUp);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function setValidForm(): void {
    component.signUpForm.setValue({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
    });
    fixture.detectChanges();
  }

  function submitForm(): void {
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
  }

  it('starts with an invalid form', () => {
    expect(component.signUpForm.invalid).toBe(true);
  });

  it('requires a first name, last name and email address', () => {
    expect(component.signUpForm.controls.firstName.hasError('required')).toBe(true);
    expect(component.signUpForm.controls.lastName.hasError('required')).toBe(true);
    expect(component.signUpForm.controls.email.hasError('required')).toBe(true);
  });

  it('rejects an invalid email address', () => {
    component.signUpForm.setValue({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'not-an-email',
    });

    expect(component.signUpForm.controls.email.hasError('email')).toBe(true);
    expect(component.signUpForm.invalid).toBe(true);
  });

  it('is valid when all fields contain acceptable values', () => {
    setValidForm();

    expect(component.signUpForm.valid).toBe(true);
  });

  it('marks invalid fields touched and does not submit', () => {
    submitForm();

    expect(Object.values(component.signUpForm.controls).every((control) => control.touched)).toBe(
      true,
    );
    expect(submittedPayloads).toHaveLength(0);
  });

  it('submits the entered sign-up data', () => {
    setValidForm();
    submitForm();

    expect(submittedPayloads).toEqual([
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
      },
    ]);
  });

  it('shows a loading state and prevents repeat submissions while pending', () => {
    const pendingResponse = new Subject<void>();
    response$ = pendingResponse;
    setValidForm();

    submitForm();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.textContent).toContain('Submitting...');

    submitForm();

    expect(submittedPayloads).toHaveLength(1);
    pendingResponse.complete();
  });

  it('shows success feedback and replaces the form after a successful response', () => {
    setValidForm();
    submitForm();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('[role="status"]')?.textContent).toContain("You're signed up!");
    expect(element.querySelector('form')).toBeNull();
  });

  it('shows an alert and preserves entered data after a failed response', () => {
    response$ = throwError(() => new Error('Request failed'));
    setValidForm();

    submitForm();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('currently unavailable');
    expect(component.signUpForm.getRawValue()).toEqual({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
    });
    expect(element.querySelector('form')).not.toBeNull();
  });

  it('resets the loading state after success', () => {
    setValidForm();
    submitForm();

    expect(component['submitting']()).toBe(false);
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });

  it('resets the loading state after failure', () => {
    response$ = throwError(() => new Error('Request failed'));
    setValidForm();
    submitForm();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    expect(button.textContent).toContain('Sign up for updates');
  });

  it('allows the user to retry after a failed submission', () => {
    response$ = throwError(() => new Error('Request failed'));
    setValidForm();
    submitForm();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();

    response$ = of(undefined);
    submitForm();

    expect(submittedPayloads).toHaveLength(2);
    expect(fixture.nativeElement.querySelector('[role="status"]')).not.toBeNull();
  });

  it('associates each input with a label', () => {
    const element: HTMLElement = fixture.nativeElement;
    const inputs = Array.from(element.querySelectorAll('input'));

    expect(inputs).toHaveLength(3);
    for (const input of inputs) {
      expect(element.querySelector(`label[for="${input.id}"]`)).not.toBeNull();
    }
  });

  it('connects invalid field messages to inputs with accessible error attributes', () => {
    submitForm();

    const element: HTMLElement = fixture.nativeElement;
    const invalidInputs = Array.from(
      element.querySelectorAll<HTMLInputElement>('input[aria-invalid="true"]'),
    );

    expect(invalidInputs).toHaveLength(3);
    for (const input of invalidInputs) {
      expect(input.getAttribute('aria-describedby')).toBe(`${input.id}-error`);
      expect(element.querySelector(`#${input.id}-error`)?.textContent).toContain('required');
    }
  });
});

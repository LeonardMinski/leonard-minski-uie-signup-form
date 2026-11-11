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

  function enterValue(name: keyof SignUpRequest, value: string): HTMLInputElement {
    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector<HTMLInputElement>(`#${name}`)!;
    input.focus();
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    return input;
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

  it('rejects whitespace-only first and last names using the required errors', () => {
    component.signUpForm.setValue({
      firstName: '   ',
      lastName: '\t ',
      email: 'jane.smith@example.com',
    });

    expect(component.signUpForm.controls.firstName.hasError('required')).toBe(true);
    expect(component.signUpForm.controls.lastName.hasError('required')).toBe(true);

    submitForm();

    const element = fixture.nativeElement as HTMLElement;
    const errors = Array.from(element.querySelectorAll<HTMLElement>('.error')).map((error) =>
      error.textContent?.trim(),
    );
    expect(errors).toContain('First name is required.');
    expect(errors).toContain('Last name is required.');
  });

  it('preserves legitimate spaces within names', () => {
    component.signUpForm.setValue({
      firstName: 'Mary Jane',
      lastName: 'Van der Smith',
      email: 'mary.jane@example.com',
    });

    expect(component.signUpForm.valid).toBe(true);
    expect(component.signUpForm.getRawValue()).toMatchObject({
      firstName: 'Mary Jane',
      lastName: 'Van der Smith',
    });
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
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.disabled).toBe(false);
    expect(button.tabIndex).toBe(0);
    expect(button.textContent).toContain('Submitting...');
    expect(fixture.nativeElement.ownerDocument.activeElement).toBe(button);

    submitForm();

    expect(submittedPayloads).toHaveLength(1);
    pendingResponse.complete();
  });

  it('shows success feedback and replaces the form after a successful response', () => {
    setValidForm();
    submitForm();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('h1')?.textContent).toContain("You're signed up!");
    expect(element.querySelector('form')).toBeNull();
  });

  it('moves focus to the rendered success heading after a successful response', async () => {
    setValidForm();
    submitForm();
    await fixture.whenStable();
    fixture.detectChanges();

    const heading = fixture.nativeElement.querySelector('h1') as HTMLHeadingElement;
    expect(heading.textContent).toContain("You're signed up!");
    expect(fixture.nativeElement.ownerDocument.activeElement).toBe(heading);
    expect(heading.getAttribute('tabindex')).toBe('-1');
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
    expect(element.ownerDocument.activeElement).toBe(element.querySelector('button'));
  });

  it('resets the loading state after failure', () => {
    response$ = throwError(() => new Error('Request failed'));
    setValidForm();
    submitForm();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-disabled')).toBe('false');
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
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain("You're signed up!");
  });

  it('associates each input with a label', () => {
    const element: HTMLElement = fixture.nativeElement;
    const inputs = Array.from(element.querySelectorAll('input'));

    expect(inputs).toHaveLength(3);
    for (const input of inputs) {
      expect(element.querySelector(`label[for="${input.id}"]`)).not.toBeNull();
    }
  });

  it('trims whitespace from names before submitting', () => {
    component.signUpForm.setValue({
      firstName: '   Jeff  ',
      lastName: '   Smith   ',
      email: 'jeff@example.com',
    });

    submitForm();

    expect(submittedPayloads).toEqual([
      {
        firstName: 'Jeff',
        lastName: 'Smith',
        email: 'jeff@example.com',
      },
    ]);
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

  it('shows email validation on blur without moving focus while typing or blurring', async () => {
    const element = fixture.nativeElement as HTMLElement;
    const input = enterValue('email', 'not-an-email');
    await fixture.whenStable();
    expect(element.querySelector('#email-error')).toBeNull();
    expect(element.ownerDocument.activeElement).toBe(input);

    input.blur();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(element.querySelector('#email-error')?.textContent).toContain(
      'Enter a valid email address.',
    );
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('email-error');
    expect(element.ownerDocument.activeElement).toBe(element.ownerDocument.body);

    enterValue('email', 'jane@example.com');
    await fixture.whenStable();
    expect(element.ownerDocument.activeElement).toBe(input);
    expect(element.querySelector('#email-error')).toBeNull();
    expect(input.getAttribute('aria-invalid')).toBe('false');
    expect(input.hasAttribute('aria-describedby')).toBe(false);
    expect(submittedPayloads).toHaveLength(0);
  });

  it.each([
    { firstName: '', lastName: '', firstInvalid: 'firstName', errors: 3 },
    { firstName: 'Jane', lastName: '', firstInvalid: 'lastName', errors: 2 },
    { firstName: 'Jane', lastName: 'Smith', firstInvalid: 'email', errors: 1 },
  ])(
    'focuses $firstInvalid after rendering invalid submission errors',
    async ({ firstName, lastName, firstInvalid, errors }) => {
      const element = fixture.nativeElement as HTMLElement;
      enterValue('firstName', firstName).blur();
      enterValue('lastName', lastName).blur();
      enterValue('email', 'invalid').blur();
      element.querySelector<HTMLButtonElement>('button')!.focus();

      submitForm();
      await fixture.whenStable();

      const input = element.querySelector<HTMLInputElement>(`#${firstInvalid}`)!;
      expect(element.ownerDocument.activeElement).toBe(input);
      expect(element.querySelectorAll('input[aria-invalid="true"]')).toHaveLength(errors);
      expect(input.getAttribute('aria-describedby')).toBe(`${firstInvalid}-error`);
      expect(element.querySelector(`#${firstInvalid}-error`)?.textContent?.trim()).toBeTruthy();
      expect(submittedPayloads).toHaveLength(0);
    },
  );

  it('submits DOM-entered values and focuses the confirmation after the response', async () => {
    const pendingResponse = new Subject<void>();
    response$ = pendingResponse;
    const element = fixture.nativeElement as HTMLElement;
    enterValue('firstName', '  Jane  ').blur();
    enterValue('lastName', 'Smith').blur();
    enterValue('email', 'jane@example.com').blur();

    element.querySelector<HTMLButtonElement>('button')!.click();
    fixture.detectChanges();
    expect(submittedPayloads).toEqual([
      { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
    ]);
    expect(element.querySelector('button')?.textContent).toContain('Submitting...');

    pendingResponse.next();
    pendingResponse.complete();
    fixture.detectChanges();
    await fixture.whenStable();

    const heading = element.querySelector('h1');
    expect(heading?.textContent).toContain("You're signed up!");
    expect(element.ownerDocument.activeElement).toBe(heading);
    expect(element.querySelector('form')).toBeNull();
    expect(element.textContent).not.toContain('Submitting...');
  });
});

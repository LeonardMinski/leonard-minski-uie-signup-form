import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  Injector,
  signal,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';

import { SIGN_UP_FIELDS } from './sign-up.config';
import { SignUpApi } from './services/sign-up-api';

const requiredNonWhitespace: ValidatorFn = (control): ValidationErrors | null =>
  typeof control.value === 'string' && control.value.trim().length > 0 ? null : { required: true };

@Component({
  selector: 'app-sign-up',
  imports: [ReactiveFormsModule],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.scss',
})
export class SignUp {
  private readonly fb = inject(FormBuilder);
  private readonly injector = inject(Injector);
  private readonly signUpApi = inject(SignUpApi);

  @ViewChild('formElement') private formElement?: ElementRef<HTMLFormElement>;
  @ViewChild('submitButton') private submitButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('successHeading') private successHeading?: ElementRef<HTMLHeadingElement>;

  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  readonly fields = SIGN_UP_FIELDS;

  readonly signUpForm = this.fb.nonNullable.group({
    firstName: ['', requiredNonWhitespace],
    lastName: ['', requiredNonWhitespace],
    email: ['', [Validators.required, Validators.email]],
  });

  getErrorMessage(control: AbstractControl, errors: Record<string, string>): string {
    const errorKey = Object.keys(errors).find((key) => control.hasError(key));
    return errorKey ? errors[errorKey] : '';
  }

  onSubmit(): void {
    if (this.submitting() || this.submitted()) return;

    if (this.signUpForm.invalid) {
      this.signUpForm.markAllAsTouched();
      afterNextRender(
        () =>
          this.formElement?.nativeElement
            .querySelector<HTMLInputElement>('input[aria-invalid="true"]')
            ?.focus(),
        { injector: this.injector },
      );
      return;
    }

    this.errorMessage.set(null);
    this.submitting.set(true);
    this.submitButton?.nativeElement.focus();

    const { firstName, lastName, email } = this.signUpForm.getRawValue();

    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
    };

    this.signUpApi
      .submitSignUp(payload)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.submitted.set(true);
          afterNextRender(() => this.successHeading?.nativeElement.focus(), {
            injector: this.injector,
          });
        },
        error: () => {
          this.errorMessage.set('Sign up is currently unavailable. Please try again later.');
        },
      });
  }
}

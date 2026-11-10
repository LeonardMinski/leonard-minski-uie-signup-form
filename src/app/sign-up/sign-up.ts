import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { SIGN_UP_FIELDS } from './sign-up.config';
import { SignUpApi } from './services/sign-up-api';

@Component({
  selector: 'app-sign-up',
  imports: [ReactiveFormsModule],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.scss',
})
export class SignUp {
  private readonly fb = inject(FormBuilder);
  private readonly signUpApi = inject(SignUpApi);

  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  readonly fields = SIGN_UP_FIELDS;

  readonly signUpForm = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
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
      return;
    }

    this.errorMessage.set(null);
    this.submitting.set(true);

    this.signUpApi
      .submitSignUp(this.signUpForm.getRawValue())
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.submitted.set(true);
        },
        error: () => {
          this.errorMessage.set('Sign up is currently unavailable. Please try again later.');
        },
      });
  }
}

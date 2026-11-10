import type { SignUpRequest } from './models/sign-up.model';

interface SignUpField {
  readonly name: keyof SignUpRequest;
  readonly label: string;
  readonly type: 'text' | 'email';
  readonly autocomplete: string;
  readonly placeholder: string;
  readonly errors: Readonly<Record<string, string>>;
}

export const SIGN_UP_FIELDS = [
  {
    name: 'firstName',
    label: 'First Name',
    type: 'text',
    autocomplete: 'given-name',
    placeholder: 'e.g. Jane',
    errors: {
      required: 'First name is required.',
    },
  },
  {
    name: 'lastName',
    label: 'Last Name',
    type: 'text',
    autocomplete: 'family-name',
    placeholder: 'e.g. Smith',
    errors: {
      required: 'Last name is required.',
    },
  },
  {
    name: 'email',
    label: 'Email address',
    type: 'email',
    autocomplete: 'email',
    placeholder: 'e.g. jane.smith@example.com',
    errors: {
      required: 'Email is required.',
      email: 'Enter a valid email address.',
    },
  },
] as const satisfies readonly SignUpField[];

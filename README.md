# National Grid sign-up form

## Overview

A small, responsive sign-up form built for the National Grid Electricity Distribution UI Engineer coding exercise. It collects a first name, last name and email address for a simulated updates subscription.

## Tech stack

Angular, TypeScript, SCSS, Reactive Forms, RxJS and Vitest.

## Getting started

Use Node.js 24.18.1 and npm 11.16.0, the versions used for local verification.

```bash
npm ci
npm start
```

Run these commands from the project directory, where `package.json` is located. The development server is available at http://localhost:4200.

## Running tests

Run the test suite once with `npm run test:ci`. Use `npm test` to run Angular's test command in its default mode.

## Implementation notes

Reactive Forms provide typed form values and field-level validation. Field labels, input types, autocomplete hints and validation messages are defined in one configuration, making it straightforward to add fields without duplicating the template structure.

The form delegates submission to an injectable API service so HTTP concerns stay separate from the UI. A functional interceptor handles `POST /api/sign-up` locally and returns HTTP 200 with an empty response body after a short simulated delay. The form shows required and email-format validation, a submitting state, an error message on failure and a confirmation on success.

## Testing

The tests cover required fields, email validation, invalid submission, request payloads, pending and repeat submissions, success and failure states, retry behaviour, field labels and validation accessibility attributes. HTTP tests check the service request and error handling, as well as the mock interceptor response and pass-through behaviour.

## Limitations

The API response is simulated in the browser. No customer information is persisted or delivered to National Grid.

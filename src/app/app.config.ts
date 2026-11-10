import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { signUpMockInterceptor } from './sign-up/mocks/sign-up.mock';

export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient(withInterceptors([signUpMockInterceptor]))],
};

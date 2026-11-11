import { Component } from '@angular/core';
import { SignUp } from './sign-up/sign-up';

@Component({
  imports: [SignUp],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {}

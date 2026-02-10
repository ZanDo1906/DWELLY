import { AbstractControl, ValidatorFn } from '@angular/forms';

export function customValidator(regex: RegExp): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {

    if (!control.value) return null;

    const match = regex.test(control.value);
    return match ? null : { nameNotMatch: true };
  };
}

export function passwordValidator(control: AbstractControl): { [key: string]: any } | null {

  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (!password || !confirmPassword) return null;

  if (password.pristine || confirmPassword.pristine) return null;

  return password.value !== confirmPassword.value
    ? { misMatch: true }
    : null;
}

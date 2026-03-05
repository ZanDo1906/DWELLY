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

export function phoneValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const rawValue = (control.value || '').toString().trim();

    if (!rawValue) return null;

    const normalizedPhone = rawValue.replace(/\s+/g, '');
    const isValidFormat = /^(0|\+84)(3|5|7|8|9)\d{8}$/.test(normalizedPhone);

    if (!isValidFormat) {
      return { invalidPhone: true };
    }

    const digitsOnly = normalizedPhone.startsWith('+84')
      ? `0${normalizedPhone.slice(3)}`
      : normalizedPhone;

    const subscriberDigits = digitsOnly.slice(-8);
    const isRepeatedSubscriber = /^([0-9])\1{7}$/.test(subscriberDigits);

    const isAscendingSequence = /^0123456789$/.test(digitsOnly);
    const isDescendingSequence = /^0987654321$/.test(digitsOnly);

    if (isRepeatedSubscriber || isAscendingSequence || isDescendingSequence) {
      return { weakPhonePattern: true };
    }

    return null;
  };
}

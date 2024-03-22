import { EMAIL_VALIDATOR_REGEX } from '../constants';

export const isValidEmail = (email: string): boolean => EMAIL_VALIDATOR_REGEX.test(email);

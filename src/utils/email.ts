/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { EMAIL_VALIDATOR_REGEX } from '../constants';

export const isValidEmail = (email: string): boolean => EMAIL_VALIDATOR_REGEX.test(email);

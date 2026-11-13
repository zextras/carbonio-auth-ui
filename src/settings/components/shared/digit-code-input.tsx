/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useEffect, useRef } from 'react';

import styled from '@emotion/styled';
import { Row } from '@zextras/carbonio-design-system';

const DigitBox = styled.input`
	width: 3rem;
	height: 3.5rem;
	text-align: center;
	font-size: 1.5rem;
	font-family: inherit;
	color: ${({ theme }): string => theme.palette.text.regular};
	background-color: ${({ theme }): string => theme.palette.gray5.regular};
	border: 0.0625rem solid ${({ theme }): string => theme.palette.gray3.regular};
	border-radius: 0.125rem;
	outline: none;
	&:focus {
		border-color: ${({ theme }): string => theme.palette.primary.regular};
	}
	&:disabled {
		opacity: 0.5;
	}
`;

export type DigitCodeInputProps = {
	length?: number;
	value: string;
	disabled?: boolean;
	focusOnMount?: boolean;
	onChange: (value: string) => void;
};

export function DigitCodeInput({
	length = 6,
	value,
	disabled = false,
	focusOnMount = false,
	onChange
}: Readonly<DigitCodeInputProps>): React.JSX.Element {
	const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

	useEffect(() => {
		if (focusOnMount && !disabled) {
			inputsRef.current[0]?.focus();
		}
	}, [focusOnMount, disabled]);

	const setDigitAt = useCallback(
		(index: number, digit: string): string =>
			(value.slice(0, index) + digit + value.slice(index + 1)).slice(0, length),
		[value, length]
	);

	const setDigitsFrom = useCallback(
		(index: number, digits: string): void => {
			const targetIndex = Math.min(index, value.length);
			const next = (value.slice(0, targetIndex) + digits).slice(0, length);
			onChange(next);
			inputsRef.current[Math.min(targetIndex + digits.length, length - 1)]?.focus();
		},
		[length, onChange, value]
	);

	const handleChange = useCallback(
		(index: number, rawValue: string): void => {
			const isTypingOverExistingDigit = rawValue.length === 2 && value[index] !== undefined;
			const inputValue = isTypingOverExistingDigit ? rawValue.slice(-1) : rawValue;
			const onlyDigits = inputValue.replace(/\D/g, '');
			if (onlyDigits === '') {
				if (rawValue === '' && index < value.length) {
					onChange(value.slice(0, index) + value.slice(index + 1));
				}
				return;
			}
			if (onlyDigits.length > 1) {
				setDigitsFrom(index, onlyDigits);
				return;
			}
			const targetIndex = Math.min(index, value.length);
			const next = setDigitAt(targetIndex, onlyDigits);
			onChange(next);
			inputsRef.current[Math.min(targetIndex + 1, length - 1)]?.focus();
		},
		[onChange, setDigitAt, setDigitsFrom, value, length]
	);

	const handlePaste = useCallback(
		(index: number, event: React.ClipboardEvent<HTMLInputElement>): void => {
			event.preventDefault();
			const digits = event.clipboardData.getData('text').replace(/\D/g, '');
			if (digits !== '') {
				setDigitsFrom(index, digits);
			}
		},
		[setDigitsFrom]
	);

	const handleKeyDown = useCallback(
		(index: number, event: React.KeyboardEvent<HTMLInputElement>): void => {
			if (event.key === 'Backspace' && !value[index] && index > 0) {
				event.preventDefault();
				const previousIndex = Math.min(index - 1, value.length - 1);
				if (previousIndex >= 0) {
					onChange(value.slice(0, previousIndex) + value.slice(previousIndex + 1));
					inputsRef.current[previousIndex]?.focus();
				}
			}
			if (event.key === 'ArrowLeft' && index > 0) {
				event.preventDefault();
				inputsRef.current[index - 1]?.focus();
			}
			if (event.key === 'ArrowRight' && index < length - 1) {
				event.preventDefault();
				inputsRef.current[index + 1]?.focus();
			}
		},
		[onChange, value, length]
	);

	return (
		<Row mainAlignment="center" gap="0.5rem">
			{Array.from({ length }, (_, index) => (
				<DigitBox
					key={index}
					data-testid={`digit-input-${index}`}
					aria-label={`digit-${index + 1}`}
					inputMode="numeric"
					pattern="[0-9]*"
					autoComplete={index === 0 ? 'one-time-code' : 'off'}
					maxLength={length}
					disabled={disabled}
					value={value[index] ?? ''}
					ref={(element: HTMLInputElement | null): void => {
						inputsRef.current[index] = element;
					}}
					onChange={(event: React.ChangeEvent<HTMLInputElement>): void =>
						handleChange(index, event.target.value)
					}
					onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>): void =>
						handleKeyDown(index, event)
					}
					onPaste={(event: React.ClipboardEvent<HTMLInputElement>): void =>
						handlePaste(index, event)
					}
					onFocus={(event: React.FocusEvent<HTMLInputElement>): void => event.target.select()}
				/>
			))}
		</Row>
	);
}

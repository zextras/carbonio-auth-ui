/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { fireEvent, screen } from '@testing-library/react';

import { customRender } from '../../../../test/test-utils';
import { DigitCodeInput } from '../digit-code-input';

function ControlledDigitCodeInput({
	onValue
}: {
	onValue?: (v: string) => void;
}): React.JSX.Element {
	const [value, setValue] = React.useState('');
	return (
		<DigitCodeInput
			value={value}
			onChange={(next): void => {
				setValue(next);
				onValue?.(next);
			}}
		/>
	);
}

describe('DigitCodeInput', () => {
	it('should render one input box per digit', () => {
		customRender(<DigitCodeInput value="" onChange={vi.fn()} />);
		expect(screen.getAllByLabelText(/^digit-\d$/)).toHaveLength(6);
	});

	it('should display each digit of the value in its own box', () => {
		customRender(<DigitCodeInput value="123456" onChange={vi.fn()} />);
		expect(screen.getByTestId('digit-input-0')).toHaveValue('1');
		expect(screen.getByTestId('digit-input-5')).toHaveValue('6');
	});

	it('should enable one-time-code autocomplete only on the first box', () => {
		customRender(<DigitCodeInput value="" onChange={vi.fn()} />);

		expect(screen.getByTestId('digit-input-0')).toHaveAttribute('autocomplete', 'one-time-code');
		screen
			.getAllByLabelText(/^digit-\d$/)
			.slice(1)
			.forEach((input) => expect(input).toHaveAttribute('autocomplete', 'off'));
	});

	it('should append the typed digit and move focus to the next box', () => {
		customRender(<ControlledDigitCodeInput />);
		fireEvent.change(screen.getByTestId('digit-input-0'), { target: { value: '7' } });
		expect(screen.getByTestId('digit-input-0')).toHaveValue('7');
		expect(screen.getByTestId('digit-input-1')).toHaveFocus();
	});

	it('should remove only the cleared digit and preserve following digits', () => {
		const onChange = vi.fn();
		customRender(<DigitCodeInput value="123456" onChange={onChange} />);

		fireEvent.change(screen.getByTestId('digit-input-2'), { target: { value: '' } });

		expect(onChange).toHaveBeenCalledWith('12456');
	});

	it('should replace an existing digit without dropping the following digits', () => {
		const onChange = vi.fn();
		customRender(<DigitCodeInput value="123456" onChange={onChange} />);

		fireEvent.change(screen.getByTestId('digit-input-2'), { target: { value: '35' } });

		expect(onChange).toHaveBeenCalledWith('125456');
		expect(screen.getByTestId('digit-input-3')).toHaveFocus();
	});

	it('should paste two digits over an existing digit', () => {
		const onChange = vi.fn();
		customRender(<DigitCodeInput value="123456" onChange={onChange} />);

		fireEvent.paste(screen.getByTestId('digit-input-2'), {
			clipboardData: { getData: (): string => '78' }
		});

		expect(onChange).toHaveBeenCalledWith('1278');
		expect(screen.getByTestId('digit-input-4')).toHaveFocus();
	});

	it('should paste a complete code into the first box', () => {
		const onChange = vi.fn();
		customRender(<DigitCodeInput value="" onChange={onChange} />);

		fireEvent.paste(screen.getByTestId('digit-input-0'), {
			clipboardData: { getData: (): string => '12 34-56' }
		});

		expect(onChange).toHaveBeenCalledWith('123456');
		expect(screen.getByTestId('digit-input-5')).toHaveFocus();
	});

	it('should ignore non-digit input without clearing an existing digit', () => {
		const onChange = vi.fn();
		customRender(<DigitCodeInput value="123" onChange={onChange} />);

		fireEvent.change(screen.getByTestId('digit-input-1'), { target: { value: '2a' } });

		expect(onChange).not.toHaveBeenCalled();
	});

	it('should append at the first empty position when typing in a later box', () => {
		const onChange = vi.fn();
		customRender(<DigitCodeInput value="12" onChange={onChange} />);

		fireEvent.change(screen.getByTestId('digit-input-4'), { target: { value: '7' } });

		expect(onChange).toHaveBeenCalledWith('127');
		expect(screen.getByTestId('digit-input-3')).toHaveFocus();
	});

	it('should focus the first box on mount when enabled', () => {
		customRender(<DigitCodeInput value="" focusOnMount onChange={vi.fn()} />);
		expect(screen.getByTestId('digit-input-0')).toHaveFocus();
	});

	it('should not focus the first box on mount when disabled', () => {
		customRender(<DigitCodeInput value="" focusOnMount disabled onChange={vi.fn()} />);
		expect(screen.getByTestId('digit-input-0')).not.toHaveFocus();
	});

	it.each([
		['a pasted code', '123456', '123456'],
		['more digits than the configured length', '12345678', '123456']
	])('should handle %s', (_description, input, expected) => {
		const onChange = vi.fn();
		customRender(<DigitCodeInput value="" onChange={onChange} />);
		fireEvent.change(screen.getByTestId('digit-input-0'), { target: { value: input } });
		expect(onChange).toHaveBeenCalledWith(expected);
	});

	it('should ignore non-numeric characters in an empty box', () => {
		const onChange = vi.fn();
		customRender(<DigitCodeInput value="" onChange={onChange} />);

		fireEvent.change(screen.getByTestId('digit-input-0'), { target: { value: 'a' } });

		expect(onChange).not.toHaveBeenCalled();
	});

	it('should remove the previous digit and move back on backspace in an empty box', () => {
		const onChange = vi.fn();
		customRender(<DigitCodeInput value="12" onChange={onChange} />);
		fireEvent.keyDown(screen.getByTestId('digit-input-2'), { key: 'Backspace' });
		expect(onChange).toHaveBeenCalledWith('1');
		expect(screen.getByTestId('digit-input-1')).toHaveFocus();
	});

	it('should remove the last entered digit when backspacing from a later empty box', () => {
		const onChange = vi.fn();
		customRender(<DigitCodeInput value="12" onChange={onChange} />);

		fireEvent.keyDown(screen.getByTestId('digit-input-5'), { key: 'Backspace' });

		expect(onChange).toHaveBeenCalledWith('1');
		expect(screen.getByTestId('digit-input-1')).toHaveFocus();
	});

	it('should move focus between boxes with the arrow keys', () => {
		customRender(<DigitCodeInput value="123" onChange={vi.fn()} />);
		const secondInput = screen.getByTestId('digit-input-1');
		secondInput.focus();

		fireEvent.keyDown(secondInput, { key: 'ArrowLeft' });
		expect(screen.getByTestId('digit-input-0')).toHaveFocus();

		fireEvent.keyDown(screen.getByTestId('digit-input-0'), { key: 'ArrowRight' });
		expect(secondInput).toHaveFocus();
	});

	it('should disable every box when disabled', () => {
		customRender(<DigitCodeInput value="" disabled onChange={vi.fn()} />);
		screen.getAllByLabelText(/^digit-\d$/).forEach((input) => expect(input).toBeDisabled());
	});
});

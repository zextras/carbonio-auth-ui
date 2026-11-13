/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { fireEvent, screen } from '@testing-library/react';

import { customRender } from '../../../../test/test-utils';
import { ActionButton } from '../action-button';
import { stepsNames } from '../steps-names';

vi.mock('@zextras/carbonio-shell-ui', () => ({
	t: (key: string): string => key
}));

describe('ActionButton', () => {
	it.each([
		[stepsNames.set_label, 'common.createPassword', 'onCreate'],
		[stepsNames.delete_password, 'buttons.yes', 'onDelete'],
		[stepsNames.generate_qrcode, 'buttons.done', 'onDone']
	] as const)('should call the matching action for the %s step', (step, label, action) => {
		const callbacks = {
			onCreate: vi.fn(),
			onDelete: vi.fn(),
			onDone: vi.fn()
		};
		customRender(<ActionButton step={step} createDisabled={false} {...callbacks} />);

		fireEvent.click(screen.getByRole('button', { name: label }));

		expect(callbacks[action]).toHaveBeenCalledOnce();
	});

	it('should disable the create button when requested', () => {
		customRender(
			<ActionButton
				step={stepsNames.set_label}
				createDisabled
				onCreate={vi.fn()}
				onDelete={vi.fn()}
				onDone={vi.fn()}
			/>
		);

		expect(screen.getByRole('button', { name: 'common.createPassword' })).toBeDisabled();
	});
});

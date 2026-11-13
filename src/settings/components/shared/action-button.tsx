/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement } from 'react';

import { Button } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import { stepsNames, type StepName } from './steps-names';

export type { QrStepName } from './steps-names';

type ActionButtonProps = {
	step: StepName;
	createDisabled: boolean;
	onCreate: () => void;
	onDelete: () => void;
	onDone: () => void;
};

export function ActionButton({
	step,
	createDisabled,
	onCreate,
	onDelete,
	onDone
}: Readonly<ActionButtonProps>): ReactElement {
	if (step === stepsNames.set_label) {
		return (
			<Button
				label={t('common.createPassword', 'Create password')}
				disabled={createDisabled}
				onClick={onCreate}
			/>
		);
	}
	if (step === stepsNames.delete_password) {
		return <Button label={t('buttons.yes', 'Yes')} color="error" onClick={onDelete} />;
	}
	return <Button label={t('buttons.done', 'Done')} onClick={onDone} />;
}

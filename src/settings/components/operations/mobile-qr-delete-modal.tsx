/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement } from 'react';

import { Button, Container, Modal, Padding, Row, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import { BigIcon } from '../shared/big-icon';

type MobileQrDeleteModalProps = {
	open: boolean;
	onClose: () => void;
	onDelete: () => void;
};

export function MobileQrDeleteModal({
	open,
	onClose,
	onDelete
}: Readonly<MobileQrDeleteModalProps>): ReactElement {
	return (
		<Modal
			title={t('mobileQr.delete.header', 'Mobile Apps | Delete Authentication')}
			open={open}
			onClose={onClose}
			customFooter={
				<Row width="100%" mainAlignment="flex-end" crossAlignment="flex-end">
					<Button label={t('buttons.cancel', 'Cancel')} onClick={onClose} color="secondary" />
					<Padding left="small">
						<Button label={t('buttons.yes', 'Yes')} color="error" onClick={onDelete} />
					</Padding>
				</Row>
			}
		>
			<Container padding="2rem">
				<Text overflow="break-word">
					{t('mobileQr.delete.title', 'Are you sure you want to delete this authentication?')}
				</Text>
				<Padding vertical="large">
					<BigIcon icon="AlertTriangleOutline" />
				</Padding>
				<Text style={{ textAlign: 'center' }} weight="bold" overflow="break-word">
					{t(
						'mobileQr.delete.description',
						'All the devices that are using this authentication are going to be ' +
							'disconnected and they will not be able to authenticate until you provide a new credential set.'
					)}
				</Text>
			</Container>
		</Modal>
	);
}

/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { Button, Container, Modal, Padding, Row, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import { BigIcon } from '../shared/big-icon';

export type MobileQrSuccessModalProps = {
	open: boolean;
	details: {
		mobileClientInfo: string;
	};
	onClose: () => void;
};

export function MobileQrSuccessModal({
	open,
	details,
	onClose
}: Readonly<MobileQrSuccessModalProps>): React.JSX.Element {
	return (
		<Modal
			title={t('appMobile.new', 'Mobile Apps | New Authentication')}
			open={open}
			onClose={onClose}
			customFooter={
				<Row width="100%" mainAlignment="flex-end">
					<Button label={t('buttons.ok', 'OK')} color="primary" onClick={onClose} />
				</Row>
			}
		>
			<Container padding="1rem" crossAlignment="flex-start" gap="0.5rem">
				<Container crossAlignment="center" gap="1rem" padding="2rem 0">
					<BigIcon icon="CheckmarkCircleOutline" color="success" />
					<Text size="large" weight="bold" style={{ textAlign: 'center' }}>
						{t('mobileQr.success.devicePaired', 'Device Paired')}
					</Text>
					<Text overflow="break-word" style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>
						{t('mobileQr.success.pairedDescription', 'Paired. The authentication is enabled.')}
					</Text>
					{details.mobileClientInfo && (
						<Padding top="medium" width="100%">
							<Container background="gray5" padding="0.75rem" crossAlignment="flex-start">
								<Row
									width="100%"
									mainAlignment="space-between"
									padding={{ vertical: 'extrasmall' }}
								>
									<Text size="small" color="secondary">
										{t('mobileQr.success.device', 'Device')}
									</Text>
									<Text size="small" weight="bold" overflow="break-word">
										{details.mobileClientInfo}
									</Text>
								</Row>
							</Container>
						</Padding>
					)}
				</Container>
			</Container>
		</Modal>
	);
}

/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useEffect, useState } from 'react';

import { Button, Container, Modal, Row, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { useHistoryNavigation } from '@zextras/carbonio-ui-commons';

interface LoginConfig {
	carbonioOTPSetupRequired?: boolean;
}

async function fetchLoginConfig(): Promise<LoginConfig> {
	try {
		const response = await fetch('/zx/login/v3/auth/config');
		if (!response.ok) {
			return {};
		}
		return await response.json();
	} catch {
		return {};
	}
}

export function TwoFactorAuthModal(): React.JSX.Element | null {
	const [showModal, setShowModal] = useState(false);
	const { replaceHistory } = useHistoryNavigation();

	useEffect(() => {
		fetchLoginConfig().then((config) => {
			if (config.carbonioOTPSetupRequired) {
				setShowModal(true);
			}
		});
	}, []);

	const handleSkip = useCallback((): void => {
		setShowModal(false);
	}, []);

	const handleConfigure = useCallback((): void => {
		setShowModal(false);
		replaceHistory('/settings/auth?section=otp');
	}, [replaceHistory]);

	if (!showModal) {
		return null;
	}

	return (
		<Modal
			title={t(
				'modal.2fa.introTitle',
				'We introduced the Two-Factor Authentication to improve the security of your account.'
			)}
			open={showModal}
			onClose={handleSkip}
			customFooter={
				<Row width="100%" mainAlignment="flex-end" gap="0.5rem">
					<Button
						label={t('buttons.skipForNow', 'SKIP FOR NOW')}
						onClick={handleSkip}
						color="secondary"
						type="outlined"
					/>
					<Button
						label={t('buttons.configure2FA', 'CONFIGURE THE 2FA')}
						onClick={handleConfigure}
						color="primary"
					/>
				</Row>
			}
		>
			<Container
				crossAlignment="flex-start"
				padding={{ horizontal: 'large', vertical: 'medium' }}
				gap="0.5rem"
			>
				<Text overflow="break-word">
					{t(
						'modal.2fa.configureTheTwoFactorAuthentication',
						'Configure the Two-Factor Authentication (2FA) service in the authentication section of the workspace settings.'
					)}
				</Text>
				<Text overflow="break-word">
					{t(
						'modal.2fa.youCanSkipThisConfiguration',
						'If you need to, you can skip this configuration.'
					)}
				</Text>
			</Container>
		</Modal>
	);
}

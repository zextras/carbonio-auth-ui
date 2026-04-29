/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { Button, Container, Divider, Padding, Row, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

type ExternalPasswordLinkProps = {
	readonly url: string;
	readonly variant: 'change' | 'reset';
};

export function ExternalPasswordLink({
	url,
	variant
}: Readonly<ExternalPasswordLinkProps>): React.JSX.Element {
	const title =
		variant === 'change'
			? t('changePassword.title', 'Change Password')
			: t('settingsAuth.Displayer.ResetPassword', 'Reset Password');

	const description =
		variant === 'change'
			? t(
					'changePassword.externalLinkDescription',
					'Your administrator set an external link to change your password. The link will open in a new tab.'
				)
			: t(
					'resetPassword.externalLinkDescription',
					'Your administrator set an external link to reset your password. The link will open in a new tab.'
				);

	const buttonLabel =
		variant === 'change'
			? t('changePassword.openExternalLink', 'Change Password')
			: t('resetPassword.openExternalLink', 'Reset Password');

	return (
		<Container
			padding={{ all: 'large' }}
			height="100%"
			crossAlignment="flex-start"
			background="gray6"
		>
			<Padding top="small" bottom="small">
				<Text weight="bold" size="extralarge">
					{title}
				</Text>
			</Padding>
			<Divider />
			<Container
				padding={{ all: 'large' }}
				crossAlignment="center"
				gap="1rem"
				width="fill"
				height="fill"
			>
				<Container
					maxWidth="30rem"
					height="100%"
					mainAlignment="center"
					crossAlignment="center"
					padding={{ vertical: 'large' }}
				>
					<Row padding={{ bottom: 'large' }}>
						<Text overflow="break-word" style={{ textAlign: 'center' }}>
							{description}
						</Text>
					</Row>
					<Row
						width="100%"
						mainAlignment="flex-start"
						padding={{ top: 'medium', bottom: 'extralarge' }}
					>
						<Divider color="gray3" />
					</Row>
					<Row width="fill">
						<Button
							label={buttonLabel}
							width="fill"
							type="outlined"
							icon="ExternalLinkOutline"
							iconPlacement="left"
							onClick={(): void => {
								window.open(url, '_blank', 'noopener,noreferrer');
							}}
						/>
					</Row>
				</Container>
			</Container>
		</Container>
	);
}

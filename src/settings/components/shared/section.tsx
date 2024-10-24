/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { Container, Divider, Text, Row } from '@zextras/carbonio-design-system';

function SectionHeader({ title }: { title: string }): React.JSX.Element {
	return (
		<Container width="100%" height="fit">
			<Row mainAlignment="flex-start" crossAlignment="center" width="100%" height="auto">
				<Row mainAlignment="flex-start" padding={{ all: 'large' }}>
					<Text size="large" weight="bold">
						{title}
					</Text>
				</Row>
			</Row>
			<Divider />
		</Container>
	);
}

function SectionBody({
	padding,
	children
}: {
	padding: { all: string };
	children: React.ReactNode;
}): React.JSX.Element {
	return (
		<Container
			mainAlignment="flex-start"
			padding={padding}
			style={{ overflowY: 'auto' }}
			height="fit"
		>
			{children}
		</Container>
	);
}

function SectionFooter({ footer }: { footer: React.JSX.Element }): React.JSX.Element {
	return (
		<Container width="100%" height="fit">
			<Divider />
			<Container height="fit" padding={{ all: 'large' }}>
				{footer}
			</Container>
		</Container>
	);
}

type SectionProps = {
	children?: React.ReactNode;
	title: string;
	footer?: React.JSX.Element;
	padding?: { all: string };
};

export function Section({
	children,
	title,
	footer,
	padding = { all: 'large' }
}: SectionProps): React.JSX.Element {
	return (
		<Container background="gray6" height="fill" mainAlignment="flex-start">
			<SectionHeader title={title} />
			<SectionBody padding={padding}>{children}</SectionBody>
			{footer && <SectionFooter footer={footer} />}
		</Container>
	);
}

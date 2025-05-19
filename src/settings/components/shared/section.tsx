/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { Container, Divider, FormSection, FormSubSection } from '@zextras/carbonio-design-system';

function SectionBody({
	padding,
	children
}: {
	padding?: { all: string };
	children: React.ReactNode;
}): React.JSX.Element {
	return (
		<FormSubSection padding={padding}>
			<Container mainAlignment="flex-start" style={{ overflowY: 'auto' }} height="fit">
				{children}
			</Container>
		</FormSubSection>
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

export function Section({ children, title, footer, padding }: SectionProps): React.JSX.Element {
	return (
		<FormSection label={title} height="fill" mainAlignment="flex-start">
			<SectionBody padding={padding}>{children}</SectionBody>
			{footer && <SectionFooter footer={footer} />}
		</FormSection>
	);
}

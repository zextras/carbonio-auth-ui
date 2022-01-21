/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';
import { Button, Container, Divider, Padding, Text, Row } from '@zextras/carbonio-design-system';

function SectionHeader({
	title,
	divider,
	showButtons,
	saveLabel,
	onSave,
	onCancel,
	isSaving,
	isDisabled
}) {
	return (
		<Container width="100%" height="fit">
			<Row mainAlignment="flex-start" crossAlignment="center" width="100%" height="auto">
				<Row mainAlignment="flex-start" padding={{ all: 'large' }}>
					<Text size="large" weight="bold">
						{title}
					</Text>
				</Row>
				{showButtons && (
					<Row padding={{ horizontal: 'small' }}>
						<Padding right="small">
							<Button
								label={'cancel'}
								color="secondary"
								onClick={onCancel}
								disabled={isSaving || isDisabled}
							/>
						</Padding>
						<Button
							label={saveLabel || 'save'}
							onClick={onSave}
							loading={isSaving}
							disabled={isSaving || isDisabled}
						/>
					</Row>
				)}
			</Row>
			{divider && <Divider />}
		</Container>
	);
}

function SectionBody({ padding, children }) {
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

function SectionFooter({ divider, footer }) {
	return (
		<Container width="100%" height="fit">
			{divider && <Divider />}
			<Container height="fit" padding={{ all: 'large' }}>
				{footer}
			</Container>
		</Container>
	);
}

export function Section({
	children,
	title,
	divider,
	footer,
	showButtons,
	saveLabel,
	onSave,
	onCancel,
	isSaving,
	padding = { all: 'large' },
	isDisabled
}) {
	return (
		<Container background="gray6" height="fill" mainAlignment="flex-start">
			<SectionHeader
				title={title}
				showButtons={showButtons}
				saveLabel={saveLabel}
				onSave={onSave}
				onCancel={onCancel}
				isSaving={isSaving}
				isDisabled={isDisabled}
				divider={divider}
			/>
			<SectionBody padding={padding}>{children}</SectionBody>
			{footer && <SectionFooter divider={divider} footer={footer} />}
		</Container>
	);
}

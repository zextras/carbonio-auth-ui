/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { Container, Padding, Row } from '@zextras/carbonio-design-system';
import styled from 'styled-components';

const HeaderWrapper = styled(Row)`
	border-bottom: 0.0625rem solid ${({ theme }) => theme.palette.gray2.regular};
`;
const ShellRightWrapper = styled(Row)`
	width: ${({ theme, width }) => `calc(${width} - ${theme.sizes.padding.large})`};
`;

export function ColumnFull({ children, ...rest }) {
	return (
		<Row width="100%" height="100%" {...rest}>
			{children}
		</Row>
	);
}

export function ColumnLeft({ width = '60%', children, ...rest }) {
	return (
		<Row width={width} height="100%" {...rest}>
			{children}
		</Row>
	);
}

export function ColumnRight({ width = '40%', children, ...rest }) {
	return (
		<ShellRightWrapper width={width} height="100%" {...rest}>
			{children}
		</ShellRightWrapper>
	);
}

export function ShellBody({ children }) {
	return (
		<Padding top="large" width="100%">
			<Row width="100%" height="100%" mainAlignment="space-between" crossAlignment="flex-start">
				{children}
			</Row>
		</Padding>
	);
}

export function ShellWrapper({ children }) {
	return (
		<Container crossAlignment="flex-start" takeAvailableSpace style={{ overflowY: 'auto' }}>
			{children}
		</Container>
	);
}

export function ShellHeader({ children }) {
	return <HeaderWrapper width="100%">{children}</HeaderWrapper>;
}

export function Shell({ children }) {
	return (
		<Container
			orientation="horizontal"
			mainAlignment="flex-start"
			crossAlignment="flex-start"
			height="100%"
			background="gray5"
			padding={{ all: 'large' }}
		>
			{children}
		</Container>
	);
}

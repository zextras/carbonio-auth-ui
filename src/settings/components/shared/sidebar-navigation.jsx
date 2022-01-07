/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';
import styled from 'styled-components';
import { Container, Divider, Icon, Padding, Row, Text } from '@zextras/zapp-ui';

const LinkText = styled(Text)`
	user-select: none;
`;
const NavigationLink = styled(Row)`
	cursor: pointer;
	background: ${({ theme, isActive }) => isActive && theme.palette.highlight.regular};
	transition: 0.2s ease-out;
	&:hover {
		background: ${({ theme, isActive }) => theme.palette[isActive ? 'highlight' : 'gray5'].hover};
	}
`;

export function SidebarNavigation({ links, activeTab, setActiveTab }) {
	return (
		<Container width="100%" height="100%" mainAlignment="flex-start" crossAlignment="stretch">
			{links.map((link, index) => (
				<div key={link.url}>
					{index !== 0 && <Divider color="gray3" />}
					<NavigationLink
						width="100%"
						padding={{ horizontal: 'large', vertical: 'medium' }}
						mainAlignment="flex-start"
						onClick={() => setActiveTab(link)}
						isActive={activeTab.name === link.name}
					>
						{link.icon && (
							<Padding right="large">
								<Icon size="large" icon={link.icon} />
							</Padding>
						)}
						<LinkText size="large" isActive={activeTab.name === link.name}>
							{link.label}
						</LinkText>
					</NavigationLink>
				</div>
			))}
		</Container>
	);
}

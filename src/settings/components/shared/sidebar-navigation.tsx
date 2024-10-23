/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import {
	Container,
	Divider,
	Icon,
	Padding,
	Row,
	Text,
	Theme
} from '@zextras/carbonio-design-system';
import styled from 'styled-components';

import { Tab } from '../../types';

const LinkText = styled(Text)`
	user-select: none;
`;
const NavigationLink = styled(Row)`
	cursor: pointer;
	background: ${({ theme, isActive }: { theme: Theme; isActive: boolean }): string | false =>
		isActive && theme.palette.highlight.regular};
	transition: 0.2s ease-out;
	&:hover {
		background: ${({ theme, isActive }: { theme: Theme; isActive: boolean }): string =>
			theme.palette[isActive ? 'highlight' : 'gray5'].hover};
	}
`;

export function SidebarNavigation({
	links,
	activeTab,
	setActiveTab
}: {
	links: Tab[];
	activeTab: Tab;
	setActiveTab: (activeTab: Tab) => void;
}): React.JSX.Element {
	return (
		<Container width="100%" height="100%" mainAlignment="flex-start" crossAlignment="stretch">
			{links.map((link, index: number) => (
				<div key={index}>
					{index !== 0 && <Divider color="gray3" />}
					<NavigationLink
						width="100%"
						padding={{ horizontal: 'large', vertical: 'medium' }}
						mainAlignment="flex-start"
						onClick={(): void => setActiveTab(link)}
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

/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { Padding, Row, Text } from '@zextras/carbonio-design-system';

export default function Heading({ title }) {
	return (
		<>
			<Row
				padding={{ all: 'small' }}
				mainAlignment="baseline"
				crossAlignment="baseline"
				width="100%"
			>
				<Text size="large" weight="bold">
					{title}
				</Text>
			</Row>
			<Padding veritcal="small" />
		</>
	);
}

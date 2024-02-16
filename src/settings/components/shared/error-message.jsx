/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { Row, Text } from '@zextras/carbonio-design-system';

export function ErrorMessage({ error }) {
	return (
		<Row width="fill" mainAlignment="flex-start" padding={{ top: 'extrasmall' }}>
			<Text size="small" color="error">
				{error}
			</Text>
		</Row>
	);
}

import React from 'react';
import { Row, Text } from '@zextras/zapp-ui';

export function ErrorMessage({ error }) {
	return (
		<Row width="fill" mainAlignment="flex-start" padding={{ top: 'extrasmall' }}>
			<Text size="small" color="error">
				{error}
			</Text>
		</Row>
	);
}

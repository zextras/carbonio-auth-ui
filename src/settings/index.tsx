import React, { FC } from 'react';
import { Text } from '@zextras/zapp-ui';
import { useTranslation } from 'react-i18next';

const Settings: FC = () => {
	const [t] = useTranslation();
	console.log('Hello World');
	return <Text>{t('hello', 'Hello World')}</Text>;
};

export default Settings;

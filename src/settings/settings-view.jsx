import React, { useState, useMemo, useCallback, useContext } from 'react';
import {
	useUserSettings,
	useReplaceHistoryCallback,
	useSaveSettingsCallback
} from '@zextras/zapp-shell';
import {
	Container,
	Padding,
	Text,
	Button,
	Row,
	Divider,
	FormSection,
	SnackbarManagerContext
} from '@zextras/zapp-ui';
import { useTranslation } from 'react-i18next';
import { differenceObject } from './components/utils';
import OptionsSettingsView from './options-settings-view';

export default function ContactSettingsView() {
	const [t] = useTranslation();
	const settings = useUserSettings()?.prefs;
	const [settingsObj, setSettingsObj] = useState({ ...settings });
	const [updatedSettings, setUpdatedSettings] = useState({});
	const replaceHistory = useReplaceHistoryCallback();
	const saveSettings = useSaveSettingsCallback();
	const createSnackbar = useContext(SnackbarManagerContext);

	const onClose = useCallback(() => {
		replaceHistory(`/folder/7`);
	}, [replaceHistory]);

	const updateSettings = useCallback(
		(e) => {
			setSettingsObj({ ...settingsObj, [e.target.name]: e.target.value });
			setUpdatedSettings({ ...updatedSettings, [e.target.name]: e.target.value });
		},
		[settingsObj, updatedSettings]
	);

	const settingsToUpdate = useMemo(
		() => differenceObject(updatedSettings, settings),
		[updatedSettings, settings]
	);

	const saveChanges = useCallback(() => {
		saveSettings({ prefs: updatedSettings }).then((res) => {
			if (res.type.includes('fulfilled')) {
				createSnackbar({
					key: `new`,
					replace: true,
					type: 'info',
					label: t('message.snackbar.settings_saved'),
					autoHideTimeout: 3000,
					hideButton: true
				});
			} else {
				createSnackbar({
					key: `new`,
					replace: true,
					type: 'error',
					label: t('snackbar.error'),
					autoHideTimeout: 3000,
					hideButton: true
				});
			}
		});
	}, [saveSettings, updatedSettings, createSnackbar, t]);

	return (
		<Container
			orientation="vertical"
			mainAlignment="space-around"
			background="gray5"
			style={{ overflowY: 'auto' }}
		>
			<Row orientation="horizontal" width="100%">
				<Row
					padding={{ all: 'small' }}
					mainAlignment="flex-start"
					width="50%"
					crossAlignment="flex-start"
				>
					<Text size="large" weight="regular">
						{t('label.contact_setting')}
					</Text>
				</Row>
				<Row
					padding={{ all: 'small' }}
					width="50%"
					mainAlignment="flex-end"
					crossAlignment="flex-end"
				>
					<Padding right="small">
						<Button label={t('label.cancel')} onClick={onClose} color="secondary" />
					</Padding>
					<Button
						label={t('label.save')}
						color="primary"
						onClick={saveChanges}
						disabled={Object.keys(settingsToUpdate).length < 1}
					/>
				</Row>
			</Row>
			<Divider />
			<Container
				orientation="vertical"
				mainAlignment="baseline"
				crossAlignment="baseline"
				background="gray5"
				style={{ overflowY: 'auto' }}
			>
				<FormSection width="50%" minWidth="calc(min(100%, 512px))">
					<OptionsSettingsView t={t} settingsObj={settingsObj} updateSettings={updateSettings} />
				</FormSection>
			</Container>
		</Container>
	);
}

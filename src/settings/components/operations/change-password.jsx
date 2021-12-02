import React, { useState, useEffect } from 'react';
import {
	Button,
	Container,
	Divider,
	PasswordInput,
	Row,
	useSnackbar,
	Text
} from '@zextras/zapp-ui';
import { getUserAccount } from '@zextras/zapp-shell';
import { useTranslation } from 'react-i18next';
import { Section } from '../shared/section';
import { ErrorMessage } from '../shared/error-message';
import { fetchSoap } from '../../network/fetchSoap';

export function ChangePassword() {
	const [oldPassword, setOldPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [errorLabelConfirmPassword, setErrorLabelConfirmPassword] = useState('');

	const { t } = useTranslation();

	const createSnackbar = useSnackbar();

	const changePasswordSoap = () => {
		fetchSoap('ChangePasswordRequest', {
			_jsns: 'urn:zimbraAccount',
			account: {
				by: 'name',
				_content: getUserAccount().name
			},
			oldPassword: { _content: oldPassword },
			password: { _content: confirmPassword }
		}).then((res) => {
			if (res && 'ChangePasswordResponse' in res && 'authToken' in res.ChangePasswordResponse) {
				createSnackbar({
					key: 1,
					type: 'success',
					label: t('changePassword.passwordChanged'),
					actionLabel: t('buttons.close')
				});
			} else {
				const errorMessage = `${t('error.somethingWrong')} [ ${res.Fault?.Reason?.Text} ]`;
				createSnackbar({
					key: 2,
					type: 'error',
					label: errorMessage,
					actionLabel: t('buttons.close')
				});
			}
		});
	};

	useEffect(() => {
		/* eslint-disable react-hooks/exhaustive-deps */
		if (confirmPassword !== newPassword && confirmPassword !== '') {
			setErrorLabelConfirmPassword(t('changePassword.mustMatch'));
		} else {
			setErrorLabelConfirmPassword('');
		}
	}, [confirmPassword, newPassword]);

	return (
		<Section title={t('changePassword.title')} divider>
			<Container maxWidth="480px">
				<Row padding="64px 0 32px">
					<Text overflow="break-word" size="large" style={{ textAlign: 'center' }}>
						{t('changePassword.instruction')}
					</Text>
				</Row>
				<Divider />
				<Row padding="32px 0 16px" width="fill">
					<PasswordInput
						label={t('changePassword.oldPassword')}
						backgroundColor="gray5"
						value={oldPassword}
						onChange={(e) => setOldPassword(e.target.value)}
					/>
				</Row>
				<Row padding={{ bottom: 'large' }} width="fill">
					<PasswordInput
						label={t('newPassword')}
						backgroundColor="gray5"
						value={newPassword}
						onChange={(e) => setNewPassword(e.target.value)}
					/>
				</Row>
				<Row padding={{ bottom: 'large' }} width="fill">
					<PasswordInput
						label={t('changePassword.confirmNew')}
						backgroundColor="gray5"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						hasError={errorLabelConfirmPassword}
					/>
					{errorLabelConfirmPassword && <ErrorMessage error={errorLabelConfirmPassword} />}
				</Row>
				<Button
					label={t('changePassword.title')}
					type="outlined"
					size="fill"
					disabled={!oldPassword || !newPassword || !confirmPassword || errorLabelConfirmPassword}
					onClick={changePasswordSoap}
				/>
			</Container>
		</Section>
	);
}

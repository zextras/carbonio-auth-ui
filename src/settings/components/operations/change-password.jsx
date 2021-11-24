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
import { getUserAccount, soapFetch } from '@zextras/zapp-shell';
import { useTranslation } from 'react-i18next';
// import { soapRequest } from '../connection/Soap/SoapManager';
import { Section } from '../shared/section';
import { ErrorMessage } from '../shared/error-message';

export function ChangePassword() {
	const [oldPassword, setOldPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [errorLabelNewPassword, setErrorLabelNewPassword] = useState('');
	const [errorLabelConfirmPassword, setErrorLabelConfirmPassword] = useState('');

	const { t } = useTranslation();

	const createSnackbar = useSnackbar();

	const changePasswordSoap = () => {
		soapFetch('ChangePassword', {
			_jsns: 'urn:zimbraAccount',
			account: {
				by: 'name',
				_content: getUserAccount().name
			},
			oldPassword: { _content: oldPassword },
			password: { _content: confirmPassword }
		})
			.then((res) => {
				if (res && res.authToken) {
					createSnackbar({
						key: 1,
						type: 'success',
						label: t('changePassword.passwordChanged'),
						actionLabel: t('buttons.close')
					});
				}
			})
			.catch(() => {
				createSnackbar({
					key: 2,
					type: 'error',
					label: t('error.somethingWrong'),
					actionLabel: t('buttons.close')
				});
			});
	};

	useEffect(() => {
		/* eslint-disable react-hooks/exhaustive-deps */
		if (newPassword !== '') {
			if (newPassword.length < 6) {
				setErrorLabelNewPassword(t('error.minimumLength'));
			} else if (newPassword.length > 20) {
				setErrorLabelNewPassword(t('error.maximumLength'));
			} else if (
				!/(?=.*[A-Z])(?=.*[a-z])(?=.*[\d])(?=.*[^\w])/.test(newPassword) &&
				newPassword !== ''
			) {
				setErrorLabelNewPassword(t('changePassword.formatNotValid'));
			} else {
				setErrorLabelNewPassword('');
			}
		} else {
			setErrorLabelNewPassword('');
		}
	}, [newPassword]);

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
				<Row padding="32px 0" mainAlignment="flex-start">
					<Text overflow="break-word">{t('changePassword.mustContain')}</Text>
					<Text>- {t('changePassword.lowerUpper')}</Text>
					<Text>- {t('changePassword.digitSpecial')}</Text>
				</Row>
				<Row padding={{ bottom: 'large' }} width="fill">
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
						hasError={errorLabelNewPassword}
					/>
					{errorLabelNewPassword && <ErrorMessage error={errorLabelNewPassword} />}
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
					// disabled={
					// 	!oldPassword ||
					// 	!newPassword ||
					// 	!confirmPassword ||
					// 	errorLabelNewPassword ||
					// 	errorLabelConfirmPassword
					// }
					onClick={changePasswordSoap}
				/>
			</Container>
		</Section>
	);
}

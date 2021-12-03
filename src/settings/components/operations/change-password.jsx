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
	const [errorLabelOldPassword, setErrorLabelOldPassword] = useState('');
	const [errorLabelNewPassword, setErrorLabelNewPassword] = useState('');
	const [errorLabelConfirmPassword, setErrorLabelConfirmPassword] = useState('');
	const [correctOldPassword, setCorrectOldPassword] = useState('');

	const { t } = useTranslation();

	const createSnackbar = useSnackbar();

	function formatPasswordRule(type, num) {
		switch (type) {
			case 'zimbraPasswordMinLength':
				return t('changePassword.zimbraPasswordMinLength', { num });
			case 'zimbraPasswordMaxLength':
				return t('changePassword.zimbraPasswordMaxLength', { num });
			case 'zimbraPasswordMinUpperCaseChars':
				return t('changePassword.zimbraPasswordMinUpperCaseChars', { num });
			case 'zimbraPasswordMinLowerCaseChars':
				return t('changePassword.zimbraPasswordMinLowerCaseChars', { num });
			case 'zimbraPasswordMinPunctuationChars':
				return t('changePassword.zimbraPasswordMinPunctuationChars', { num });
			case 'zimbraPasswordMinNumericChars':
				return t('changePassword.zimbraPasswordMinNumericChars', { num });
			default:
				return t('error.somethingWrong');
		}
	}

	function formatPasswordCode(code) {
		switch (code) {
			case 'account.AUTH_FAILED':
				setErrorLabelOldPassword(t('changePassword.incorrectPassword'));
				break;
			case 'account.PASSWORD_RECENTLY_USED':
				setErrorLabelNewPassword(t('changePassword.recentlyUsedPassword'));
				break;
			default:
				createSnackbar({
					key: 2,
					type: 'error',
					label: t('error.somethingWrong'),
					actionLabel: t('buttons.close')
				});
		}
	}

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
			} else if ('a' in res.Fault.Detail.Error) {
				const { n: type, _content: num } = res.Fault.Detail.Error.a[0];
				const errorMessage = formatPasswordRule(type, num);
				setErrorLabelNewPassword(errorMessage);
				setCorrectOldPassword(oldPassword);
			} else if (res.Fault.Detail.Error.Code) {
				const code = res.Fault.Detail.Error.Code;
				formatPasswordCode(code);
			} else {
				createSnackbar({
					key: 2,
					type: 'error',
					label: t('error.somethingWrong'),
					actionLabel: t('buttons.close')
				});
			}
		});
	};

	useEffect(() => {
		/* eslint-disable react-hooks/exhaustive-deps */
		setErrorLabelOldPassword('');
	}, [oldPassword]);

	useEffect(() => {
		if (correctOldPassword && newPassword === correctOldPassword) {
			setErrorLabelNewPassword(t('changePassword.sameOldPassword'));
		} else {
			setErrorLabelNewPassword('');
		}
	}, [newPassword]);

	useEffect(() => {
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
						hasError={errorLabelOldPassword}
					/>
					{errorLabelOldPassword && <ErrorMessage error={errorLabelOldPassword} />}
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
					disabled={
						!oldPassword ||
						!newPassword ||
						!confirmPassword ||
						errorLabelOldPassword ||
						errorLabelNewPassword ||
						errorLabelConfirmPassword
					}
					onClick={changePasswordSoap}
				/>
			</Container>
		</Section>
	);
}

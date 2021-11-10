import React from 'react';
import { Container, Row, FormSubSection, Select, Input, Checkbox } from '@zextras/zapp-ui';
import Heading from './components/settings-heading';
import { findLabel } from './components/utils';

export default function OptionsSettingsView({ t, settingsObj, updateSettings }) {
	return (
		<FormSubSection label="Options">
			<Container crossAlignment="baseline" padding={{ all: 'small' }}>
				<Heading title="Settings" />
				<Checkbox
					label={t('settings.contacts.checkbox.add_contact_to_emailed_contacts')}
					value={settingsObj.zimbraPrefAutoAddAddressEnabled === 'TRUE'}
					onClick={() =>
						updateSettings({
							target: {
								name: 'zimbraPrefAutoAddAddressEnabled',
								value: settingsObj.zimbraPrefAutoAddAddressEnabled === 'TRUE' ? 'FALSE' : 'TRUE'
							}
						})
					}
				/>
				<Checkbox
					label={t('settings.contacts.checkbox.srch_glbl_addrs_list')}
					value={settingsObj.zimbraPrefGalSearchEnabled === 'TRUE'}
					onClick={() =>
						updateSettings({
							target: {
								name: 'zimbraPrefGalSearchEnabled',
								value: settingsObj.zimbraPrefGalSearchEnabled === 'TRUE' ? 'FALSE' : 'TRUE'
							}
						})
					}
				/>
			</Container>
			<Container crossAlignment="baseline" padding={{ all: 'small' }}>
				<Heading title="Autocomplete" />
				<Checkbox
					label={t('settings.contacts.checkbox.incl_addrs_in_glbl_addrs_list')}
					value={settingsObj.zimbraPrefGalAutoCompleteEnabled === 'TRUE'}
					onClick={() =>
						updateSettings({
							target: {
								name: 'zimbraPrefGalAutoCompleteEnabled',
								value: settingsObj.zimbraPrefGalAutoCompleteEnabled === 'TRUE' ? 'FALSE' : 'TRUE'
							}
						})
					}
				/>
				<Checkbox
					label={t('settings.contacts.checkbox.include_add_in_shared_contact')}
					value={settingsObj.zimbraPrefSharedAddrBookAutoCompleteEnabled === 'TRUE'}
					onClick={() =>
						updateSettings({
							target: {
								name: 'zimbraPrefSharedAddrBookAutoCompleteEnabled',
								value:
									settingsObj.zimbraPrefSharedAddrBookAutoCompleteEnabled === 'TRUE'
										? 'FALSE'
										: 'TRUE'
							}
						})
					}
				/>
				<Checkbox
					label={t('settings.contacts.checkbox.autocomplete_on_comma')}
					value={settingsObj.zimbraPrefAutoCompleteQuickCompletionOnComma === 'TRUE'}
					onClick={() =>
						updateSettings({
							target: {
								name: 'zimbraPrefAutoCompleteQuickCompletionOnComma',
								value:
									settingsObj.zimbraPrefAutoCompleteQuickCompletionOnComma === 'TRUE'
										? 'FALSE'
										: 'TRUE'
							}
						})
					}
				/>
			</Container>
		</FormSubSection>
	);
}

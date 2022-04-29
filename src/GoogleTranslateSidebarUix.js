import { useEffect, useState } from 'react';

import {
    Wrapper,
    useUiExtension,
} from '@graphcms/uix-react-sdk'

import axios from 'axios';

import { Button, Stack } from '@mui/material';
import GTranslateIcon from '@mui/icons-material/GTranslate';
import { astToHtmlString } from '@graphcms/rich-text-html-renderer';
import htmlToSlateAST from '@graphcms/html-to-slate-ast';

const getLanguageCode = (languageCode) => {
    if (languageCode.startsWith('localization_')) {
        return languageCode.slice(-2);
    } else {
        return languageCode.substring(0, 2);
    }
}

const GoogleTranslateWidget = () => {
    const { allLocales, extension, form: { getFieldState, change, subscribeToFormState } } = useUiExtension();
    const [translatableFields, setTranslatableFields] = useState([]);
    const [buttonLabel, setButtonLabel] = useState('Translate');

    const authKey = extension.config.API_KEY;

    const sourceLanguage = getLanguageCode(allLocales[0].apiId);
    const defaultLanguage = 'localization_' + sourceLanguage;

    useEffect(() => {

        const getTranslatableFields = (formFields) => {
            const fields = Object.entries(formFields.modified);
            const translatableFields = [];
            const defaultFields = [];

            fields.map((field) => {
                let fieldKey = field[0];
                if (fieldKey.startsWith('localization_')) {
                    if (fieldKey.startsWith(defaultLanguage)) {
                        defaultFields.push(fieldKey);
                    } else {
                        translatableFields.push(fieldKey);
                    }
                }
                return true;
            });

            return {
                defaultFields,
                translatableFields,
            };
        }

        let unsubscribe;
        subscribeToFormState(
            (state) => {
                const { defaultFields, translatableFields } = getTranslatableFields(state);
                // console.log('translatable:', { defaultFields, translatableFields })
                setTranslatableFields(translatableFields);
            },
            {
                modified: true
            }
        ).then((formState) => unsubscribe = formState);

        return () => {
            unsubscribe?.();
        }
    }, [subscribeToFormState, defaultLanguage]);

    const translate = () => {

        setButtonLabel('Translating...');

        // console.log('translatableFields:', translatableFields);
        // console.log('defaultLanguageFields:', defaultLanguageFields);

        translatableFields.map((field) => {
            const [fieldPrefix, fieldApiId] = field.split('.');
            const targetLanguage = getLanguageCode(fieldPrefix);

            const defaultLanguageField = defaultLanguage + '.' + fieldApiId;
            getFieldState(defaultLanguageField).then(({ value }) => {

                let textToTranslate = value;
                let isRichTextEditor = textToTranslate.hasOwnProperty('raw') ? true : false;

                // Rich Text Editor - Transform AST to HTML
                if(isRichTextEditor) {
                    const content = textToTranslate.raw;
                    textToTranslate = astToHtmlString({content});
                    // console.log('html:', textToTranslate);
                }

                axios.post(
                    'https://translation.googleapis.com/language/translate/v2?key=' + authKey,
                    {
                        q: textToTranslate,
                        source: sourceLanguage,
                        target: targetLanguage,
                        format: 'text',
                    }
                ).then((response) => {
                    if (response?.data?.data?.translations) {
                        let newText = response?.data?.data?.translations[0].translatedText;

                        // RTE - HTML to AST
                        if(isRichTextEditor) {
                            // console.log('html ' + targetLanguage + ':', newText);
                            htmlToSlateAST(newText).then((astValue) => {
                                const content = {
                                    raw: {
                                        children: astValue
                                    }
                                };
                                // console.log(`ast ${targetLanguage}:`, content);
                                change(`${fieldPrefix}.${fieldApiId}`, content);
                            });
                        } else {
                            change(`${fieldPrefix}.${fieldApiId}`, newText);
                        }
                    }

                    setButtonLabel('Translate');
                }).catch((error) => {
                    console.log(error);

                    setButtonLabel('Translate');
                });

            });

            return true;
        });
    }

    return (
        <Stack>
            <Button startIcon={<GTranslateIcon />} variant='contained' size='small' onClick={translate} disableElevation>{buttonLabel}</Button>
        </Stack>
    );
};

const declaration = {
    name: 'Google Translate',
    description: 'Translate your content to 100+ languages',
    extensionType: 'formSidebar',
    // Global configuration
    config: {
        API_KEY: {
            type: 'string',
            displayName: 'API Key',
            description: 'Enter your Google Translate API Key',
            required: true,
        }
    },
    // Sidebar UI Extension only
    // This is an instance configuration
    // sidebarConfig: {
    //     TITLE_FIELD: {
    //         type: 'string',
    //         displayName: 'Title Field',
    //         description: 'Enter title field apiId',
    //         required: true,
    //     },
    //     CONTENT_FIELD: {
    //         type: 'string',
    //         displayName: 'Content Field',
    //         description: 'Enter content field apiId. Warning: Rich text field are not supported.',
    //         required: true,
    //     }
    // }
};

const GoogleTranslateSidebarExtension = () => {
    return (
        <Wrapper declaration={declaration}>
            <GoogleTranslateWidget />
        </Wrapper>
    )
}

export default GoogleTranslateSidebarExtension;
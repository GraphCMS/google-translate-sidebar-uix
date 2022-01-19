import { useState, useEffect } from 'react';

import {
    Wrapper,
    useUiExtension,
} from '@graphcms/uix-react-sdk'

import axios from 'axios';

const GoogleTranslateWidget = () => {
    const { allLocales, extension, model: { fields }, form: { subscribeToFieldState, change } } = useUiExtension();
    const [ title, setTitle ] = useState('');
    const [ content, setContent ] = useState('');
    const [ sourceLanguage, setSourceLanguage ] = useState('');
    const [ targetLanguage, setTargetLanguage ] = useState('');
    const [ translatableFields, setTranslatableFields ] = useState([]);

    const authKey = extension.config.API_KEY;

    const getLanguageCode = (languageCode) => {
        return languageCode.substring(0, 2);
    }

    useEffect(() => {
        const transFields = fields.filter((f) => f.isLocalized);
        setTranslatableFields(transFields);
    }, [fields]);

    useEffect(() => {

        const sourceLanguageCode = getLanguageCode(allLocales[0].apiId);
        setSourceLanguage(sourceLanguageCode);

        const targetLanguageCode = getLanguageCode(allLocales[1].apiId);
        setTargetLanguage(targetLanguageCode);

        let unsubscribe;
        subscribeToFieldState(
            `localization_en.title`, 
            (state) => {
                setTitle(state.value);
            }
        ).then(fieldUnsubscribe => unsubscribe = fieldUnsubscribe);

        return () => {
            unsubscribe?.()
        };
        
    },[subscribeToFieldState, allLocales]);

    useEffect(() => {

        let unsubscribe;
        subscribeToFieldState(
            `localization_en.content`, 
            (state) => {
                setContent(state.value);
            }
        ).then(fieldUnsubscribe => unsubscribe = fieldUnsubscribe);

        return () => {
            unsubscribe?.()
        };

    }, [subscribeToFieldState, allLocales]);

    const translate = () => {
        translatableFields.map((field) => {

            const currentTarget = field.apiId === 'title' ? title : content;

            axios.post(
                'https://translation.googleapis.com/language/translate/v2?key=' + authKey, 
                {
                    q: currentTarget,
                    source: sourceLanguage,
                    target: targetLanguage,
                }
            ).then((response) => {
                if(response?.data?.data?.translations) {
                    let newText = response?.data?.data?.translations[0].translatedText;
                    change(`localization_pt_BR.${field.apiId}`, newText);
                }
            }).catch((error) => {
                console.log(error);
            });

            return null;
        }); 
    }

    const btnStyle = {
        alignItems: 'center',
        backgroundColor: '#32c48d',
        border: '0',
        borderRadius: '4px',
        color: '#ffffff',
        display: 'inline-flex',
        fontWeight: '500px',
        height: '32px',
        lineHeight: '16px',
        marginBottom: '8px',
        padding: '1px 12px',
        textAlign: 'center',
        verticalAlign: 'middle',
    };

    return (
        <>
            <button style={btnStyle} onClick={translate}>Translate All</button><br />
        </>
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
    //     API_KEY: {
    //         type: 'string',
    //         displayName: 'API Key',
    //         description: 'Enter your API Key',
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
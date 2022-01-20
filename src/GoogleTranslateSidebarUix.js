import {
    Wrapper,
    useUiExtension,
} from '@graphcms/uix-react-sdk'

import axios from 'axios';

const GoogleTranslateWidget = () => {
    const { allLocales, extension, form: { getState, change } } = useUiExtension();

    const authKey = extension.config.API_KEY;

    const getLanguageCode = (languageCode) => {
        return languageCode.substring(0, 2);
    }

    const sourceLanguage = getLanguageCode(allLocales[0].apiId);
    const targetLanguage = getLanguageCode(allLocales[1].apiId);
    const defaultLanguage = 'localization_' + sourceLanguage;
    const targetLocalization = 'localization_' + targetLanguage;

    const translate = () => {

        getState().then(({values}) => {

            // console.log('form values:', values);

            const asArray = Object.entries(values);
            const filtered = asArray.filter(([key]) => key.startsWith('localization_'));
            const translatableFields = Object.fromEntries(filtered);

            // console.log('translatableFields:', translatableFields);

            Object.keys(translatableFields[defaultLanguage]).map((field) => {
                if(field !== 'updatedAt') {
                    const currentTarget = translatableFields[defaultLanguage][field];
                    axios.post(
                        'https://translation.googleapis.com/language/translate/v2?key=' + authKey, 
                        {
                            q: currentTarget,
                            source: sourceLanguage,
                            target: targetLanguage,
                            format: 'text',
                        }
                    ).then((response) => {
                        if(response?.data?.data?.translations) {
                            let newText = response?.data?.data?.translations[0].translatedText;
                            change(`${targetLocalization}.${field}`, newText);
                        }
                    }).catch((error) => {
                        console.log(error);
                    });
                }
                return null;
            });



            
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
            <button style={btnStyle} onClick={translate}>Translate to {allLocales[1].displayName}</button><br />
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
    sidebarConfig: {
        TITLE_FIELD: {
            type: 'string',
            displayName: 'Title Field',
            description: 'Enter title field apiId',
            required: true,
        },
        CONTENT_FIELD: {
            type: 'string',
            displayName: 'Content Field',
            description: 'Enter content field apiId. Warning: Rich text field are not supported.',
            required: true,
        }
    }
};

const GoogleTranslateSidebarExtension = () => {
    return (
        <Wrapper declaration={declaration}>
            <GoogleTranslateWidget />
        </Wrapper>
    )
}

export default GoogleTranslateSidebarExtension;
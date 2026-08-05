import { useEffect } from 'react';

const GoogleTranslate = () => {
    useEffect(() => {
        const initTranslate = () => {
            if (window.google &&
                window.google.translate &&
                window.google.translate.TranslateElement &&
                !document.querySelector('.goog-te-gadget')) {

                new window.google.translate.TranslateElement({
                    pageLanguage: 'vi',
                    includedLanguages: 'en,vi,ja',
                    layout: window.google.translate.TranslateElement.InlineLayout?.SIMPLE || 0,
                    autoDisplay: false
                }, 'google_translate_element');
            }
        };

        // Try initializing immediately
        initTranslate();

        // Also add a listener for when the script finishes loading
        window.googleTranslateElementInit = initTranslate;
    }, []);

    return (
        <div id="google_translate_element" className="google-translate-wrapper" />
    );
};

export default GoogleTranslate;



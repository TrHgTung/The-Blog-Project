'use client';
import { useEffect, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

/**
 * CaptchaWidget - Wrapper component cho Google reCAPTCHA v2
 */
const CaptchaWidget = ({ onVerify, onExpire, captchaRef }) => {
    const [siteKey, setSiteKey] = useState('');
    const [isLocal, setIsLocal] = useState(false);

    useEffect(() => {
        const isLocalhost = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' || 
                           window.location.hostname === '192.168.1.7';
        
        setIsLocal(isLocalhost);
        
        const RECAPTCHA_SITE_KEY = isLocalhost
            ? (process.env.NEXT_PUBLIC_RECAPTCHA_TEST_SITE_KEY || process.env.NEXT_PUBLIC_RECAPTCHA_TEST_SITE_KEY2)
            : process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
        
        setSiteKey(RECAPTCHA_SITE_KEY);
    }, []);

    const handleBypass = () => {
        onVerify('dev-bypass-token');
    };

    if (!siteKey) return <div style={{ height: '78px' }}>Captcha is initializing...</div>;
    
    return (
        <div className="captcha-wrapper">
            <ReCAPTCHA
                ref={captchaRef}
                sitekey={siteKey}
                onChange={onVerify}
                onExpired={onExpire}
                theme="dark"
            />
            {isLocal && (
                <div style={{ marginTop: '10px' }}>
                    <button 
                        type="button" 
                        onClick={handleBypass}
                        style={{
                            fontSize: '0.8rem',
                            padding: '4px 8px',
                            background: '#333',
                            color: '#00ff00',
                            border: '1px solid #00ff00',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Bypass Captcha (Local Dev Only)
                    </button>
                </div>
            )}
        </div>
    );
};

export default CaptchaWidget;



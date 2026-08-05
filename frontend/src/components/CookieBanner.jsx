import { useState, useEffect } from 'react';

const CookieBanner = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const cookieConsent = localStorage.getItem('cookieAcceptance');
        // Nếu chưa tồn tại hoặc là false thì hiện
        if (!cookieConsent || cookieConsent === 'false') {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookieAcceptance', 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="cookie-banner-container">
            <div className="cookie-prompt-text">
                Website này không khai thác thông tin của bạn, nhưng cần lưu trữ trên cookie trình duyệt của bạn để website có thể hoạt động một cách hiệu quả nhất. <br />Bằng cách nhấn vào <i>Tôi đồng ý</i>, bạn đã cho phép website lưu trữ trên cookie của trình duyệt.<br />
                Pokémon (name, images...) is a trademark of Nintendo, Creatures Inc., Game Freak and this website is not connected with them, not used Pokémon and itself for commercial purposes.
            </div>
            <button className="cookie-accept-btn" onClick={handleAccept}>
                Tôi đồng ý
            </button>
        </div>
    );
};

export default CookieBanner;

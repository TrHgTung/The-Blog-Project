import GoogleTranslate from './GoogleTranslate';
import { LogOut, User, MessageSquare, Home, PlusSquare, Users, Menu, X, Languages } from 'lucide-react';
import { useState } from 'react';

const TranslateBar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        setIsMenuOpen(false);
        navigate('/login');
    };

    const closeMenu = () => setIsMenuOpen(false);
    return (
        <div className="nav-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GoogleTranslate />
            <button className="mobile-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
        </div>
    );
};

export default TranslateBar;


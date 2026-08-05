import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from '@/next-compat';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { LogOut, MessageSquare, Calendar, Home, PlusSquare, BookOpen, Users, Info, Bell, Check, Utensils } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isLightBg, setIsLightBg] = useState(false);
    const notifRef = useRef(null);
    const navRef = useRef(null);
    const location = useLocation();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Detect white-background elements overlapping navbar
    useEffect(() => {
        const checkOverlap = () => {
            const nav = navRef.current;
            if (!nav) return;
            const navRect = nav.getBoundingClientRect();
            // CSS selectors for elements with white/light backgrounds
            const lightElements = document.querySelectorAll(
                '.magazine-flip-page, .magazine-container, [data-light-bg="true"]'
            );
            let overlapping = false;
            lightElements.forEach(el => {
                const rect = el.getBoundingClientRect();
                // Check vertical overlap with navbar
                if (rect.top < navRect.bottom && rect.bottom > navRect.top) {
                    // Check if the element is actually visible and has a light background
                    const style = window.getComputedStyle(el);
                    const bg = style.backgroundColor;
                    if (bg && isLightColor(bg)) {
                        overlapping = true;
                    }
                }
            });
            setIsLightBg(overlapping);
        };

        const isLightColor = (colorStr) => {
            // Parse rgb/rgba
            const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (!match) return false;
            const [, r, g, b] = match.map(Number);
            // Calculate perceived brightness
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            return brightness > 180;
        };

        window.addEventListener('scroll', checkOverlap, { passive: true });
        // Also check on resize and after DOM updates
        window.addEventListener('resize', checkOverlap, { passive: true });
        // Initial check after a small delay for DOM to settle
        const timer = setTimeout(checkOverlap, 300);

        return () => {
            window.removeEventListener('scroll', checkOverlap);
            window.removeEventListener('resize', checkOverlap);
            clearTimeout(timer);
        };
    }, [location.pathname]);

    const handleLogout = () => {
        logout();
        setIsMenuOpen(false);
        navigate('/login');
    };

    const closeMenu = () => setIsMenuOpen(false);

    return (
        <>
            <nav className={`navbar ${isLightBg ? 'navbar-light-bg' : ''}`} translate="no" ref={navRef}>
                <div className="nav-container">
                    <Link to="/" className="nav-logo flex-icon" onClick={closeMenu}>
                        <img src="https://blogsocial.io.vn/favicon.png" width="32px" height="32px" title="BlogSocial" alt="BlogSocial - Nền tảng cộng đồng kết nối mọi người" />
                        <span>BlogSocial</span>
                    </Link>


                    <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>

                        {user ? (
                            <>
                                <Link to="/groups" className="nav-link" onClick={closeMenu}><Users size={20} /> Cộng đồng</Link>
                                <Link to="/game-center" className="nav-link" onClick={closeMenu}><Calendar size={20} /> GamesHub</Link>
                                <Link to="/what-should-i-eat" className="nav-link" onClick={closeMenu}><Utensils size={20} /> Ăn vặt</Link>
                                <Link to="/create-post" className="nav-link" onClick={closeMenu}><PlusSquare size={20} />Chia sẻ</Link>
                                <Link to="/chat" className="nav-link" onClick={closeMenu}><MessageSquare size={20} /> Chát</Link>
                                <Link to="/magazine" className="nav-link" onClick={closeMenu}><BookOpen size={20} /> Tạp chí</Link>
                                {/* Notification */}
                                <div className="nav-notification" ref={notifRef}>
                                    <div onClick={() => setIsNotifOpen(!isNotifOpen)} className="nav-link">
                                        <Bell size={20} />
                                        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                                        <span className="display-name-desk"></span>
                                    </div>

                                    {isNotifOpen && (
                                        <div className="notification-dropdown">
                                            <div className="notification-header">
                                                <span style={{ fontWeight: 600 }}>Thông báo</span>
                                                {unreadCount > 0 && (
                                                    <button
                                                        onClick={markAllAsRead}
                                                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                                                    >
                                                        <Check size={14} /> Đánh dấu đã đọc tất cả
                                                    </button>
                                                )}
                                            </div>
                                            <div className="notification-list">
                                                {notifications.length > 0 ? (
                                                    notifications.map(n => (
                                                        <div
                                                            key={n.id}
                                                            className={`notification-item ${n.isRead ? '' : 'unread'}`}
                                                            onClick={() => {
                                                                markAsRead(n.id);
                                                                setIsNotifOpen(false);
                                                                if (n.type === 'Message') navigate('/chat');
                                                                if (n.type === 'Like' || n.type === 'Comment' || n.type === 'Reply') {
                                                                    if (n.relatedItemId) {
                                                                        navigate(`/post/${n.relatedItemSlug}`);
                                                                    } else {
                                                                        navigate('/');
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            <img
                                                                src={n.senderProfilePicture || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/cartoon/${n.sendercartoonCharacter}.png`}
                                                                className="avatar"
                                                                style={{ width: '32px', height: '32px' }}
                                                                alt="Avatar"
                                                            />
                                                            <div className="notification-content">
                                                                <div className="notification-text">{n.content}</div>
                                                                <div className="notification-time">
                                                                    {formatDistanceToNow(new Date(n.createdAt.endsWith('Z') ? n.createdAt : n.createdAt + 'Z'), { addSuffix: true, locale: vi })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                                        Không có thông báo nào
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <Link to={`/profile/${user.id}`} className="nav-link" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <img
                                        src={user.profilePicture || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/cartoon/${user.cartoonCharacter}.png`}
                                        className="avatar"
                                        style={{ width: '24px', height: '24px', border: '1px solid var(--primary)' }}
                                        alt="user avatar"
                                    /> <span className='display-name-desk' title={user.displayName}>Hồ sơ</span>
                                </Link>
                                <button onClick={handleLogout} className="nav-logout-btn"><LogOut size={20} /> Đăng xuất</button>
                                <Link to="/about" className="nav-link" onClick={closeMenu}><Info size={20} /></Link>
                            </>
                        ) : (
                            <>
                                <Link to="/landing-page" className="nav-link" onClick={closeMenu}><Info size={20} /> Giới thiệu</Link>
                                <Link to="/game-center" className="nav-link" onClick={closeMenu}><Calendar size={20} /> GamesHub</Link>
                                <Link to="/magazine" className="nav-link" onClick={closeMenu}><BookOpen size={20} /> Tạp chí</Link>
                                <Link to="/what-should-i-eat" className="nav-link" onClick={closeMenu}><Utensils size={20} /> Ăn vặt</Link>
                                <Link to="/login" className="nav-link" onClick={closeMenu}>Đăng nhập</Link>
                                <Link to="/register" className="nav-link nav-register-btn" onClick={closeMenu}>Bắt đầu tham gia</Link>
                            </>
                        )}

                    </div>
                </div>
            </nav>


        </>
    );
};

export default Navbar;



import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from '@/next-compat';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Home, Users, Calendar, BookOpen, UtensilsCrossed, MessageSquare, User, Bell, Check, LogIn, UserPlus, Menu, Pencil } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import styles from '../component-css/BottomNav.module.css';


const BottomNav = () => {
    const { user } = useAuth();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const currentPath = location.pathname;

    // Close menu when path changes
    useEffect(() => {
        setIsMoreOpen(false);
    }, [currentPath]);

    // Danh sách các trang cho phép hiển thị
    const showOnPaths = ['/', '/groups', '/magazine', '/chat', '/notifications', '/login', '/register', '/countdown', '/mini-game', '/fruit-ninja', '/world-cup', '/about', '/create-magazine', '/search', '/post', '/what-should-i-eat', '/game-center', '/privacy-policy', '/my-characters', '/create-post'];
    const isProfilePage = currentPath.startsWith('/profile');
    const isAuthPage = currentPath === '/login' || currentPath === '/register';

    // Kiểm tra xem path hiện tại có thuộc danh sách được phép hiển thị không
    const isAllowedPath = showOnPaths.some(path => {
        if (path === '/') return currentPath === '/';
        return currentPath.startsWith(path);
    }) || isProfilePage;

    if (!isAllowedPath) {
        return null;
    }

    // Helper function để kiểm tra xem link có đang active không
    const isActive = (path) => {
        if (path === '/') return currentPath === '/';
        return currentPath.startsWith(path);
    };

    return (
        <div id='bottomNavCont' className={styles['bottom-nav-container']}>
            {/* More Menu Overlay */}
            {isMoreOpen && (
                <div className={styles['more-menu-overlay']} onClick={() => setIsMoreOpen(false)}>
                    <div className={styles['more-menu-content']} onClick={e => e.stopPropagation()}>
                        <Link to="/groups" className={`${styles['more-menu-item']} ${isActive('/groups') ? styles.active : ''}`}>
                            <Users size={22} />
                            <span>Cộng đồng</span>
                        </Link>
                        <Link to="/game-center" className={`${styles['more-menu-item']} ${isActive('/game-center') ? styles.active : ''}`}>
                            <Calendar size={22} />
                            <span>GamesHub</span>
                        </Link>
                        <Link to="/magazine" className={`${styles['more-menu-item']} ${isActive('/magazine') ? styles.active : ''}`}>
                            <BookOpen size={22} />
                            <span>Tạp chí</span>
                        </Link>
                        <Link to="/what-should-i-eat" className={`${styles['more-menu-item']} ${isActive('/what-should-i-eat') ? styles.active : ''}`}>
                            <UtensilsCrossed size={22} />
                            <span>Ăn gì</span>
                        </Link>
                        <Link to="/create-post" className={`${styles['more-menu-item']} ${isActive('/create-post') ? styles.active : ''}`}>
                            <Pencil size={22} />
                            <span>Đăng bài</span>
                        </Link>
                    </div>
                </div>
            )}

            <div className={styles['bottom-nav']} translate="no">
                {user ? (
                    <>
                        <Link to="/" className={`${styles['bottom-nav-item']} ${isActive('/') ? styles.active : ''}`}>
                            <Home size={22} strokeWidth={isActive('/') ? 2.5 : 2} />
                            <span className={styles['bottom-nav-item-text-label']}>Bảng tin</span>
                        </Link>
                        {/* <Link to="/games-hub" className={`${styles['bottom-nav-item']} ${isActive('/games-hub') ? styles.active : ''}`}>
                            <Calendar size={22} />
                            <span className={styles['bottom-nav-item-text-label']}>GamesHub</span>
                        </Link> */}
                        <Link to="/chat" className={`${styles['bottom-nav-item']} ${isActive('/chat') ? styles.active : ''}`}>
                            <MessageSquare size={22} strokeWidth={isActive('/chat') ? 2.5 : 2} />
                            <span className={styles['bottom-nav-item-text-label']}>Trò chuyện</span>
                        </Link>
                        <Link to="/notifications" className={`${styles['bottom-nav-item']} ${isActive('/notifications') ? styles.active : ''}`}>
                            <div style={{ position: 'relative' }}>
                                <Bell size={22} strokeWidth={isActive('/notifications') ? 2.5 : 2} />
                                {unreadCount > 0 && (
                                    <span className="notification-badge" style={{ top: '-4px', right: '-4px' }}>
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                            <span className={styles['bottom-nav-item-text-label']}>Thông báo</span>
                        </Link>
                        <Link
                            to={`/profile/${user.id || user.username}`}
                            className={`${styles['bottom-nav-item']} ${isActive('/profile') ? styles.active : ''}`}
                        >
                            <img
                                src={user.profilePicture || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/cartoon/${user.cartoonCharacter}.png`}
                                alt={user.displayName}
                                className="navbottom__avatar-profile-link__white-border"
                                style={{ width: '22px', height: '22px' }}
                            />
                            <span className={styles['bottom-nav-item-text-label']}>Bạn</span>
                        </Link>
                        <button
                            className={`${styles['bottom-nav-item']} ${isMoreOpen ? styles.active : ''}`}
                            onClick={() => setIsMoreOpen(!isMoreOpen)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                <Menu size={22} strokeWidth={isMoreOpen ? 2.5 : 2} />
                                <span className={styles['bottom-nav-item-text-label']}>Thêm</span>
                            </div>
                        </button>
                    </>
                ) : (
                    <>
                        {isAuthPage ? (
                            <Link to="/" className={`${styles['bottom-nav-item']} ${isActive('/') ? styles.active : ''}`} style={{ width: '100%' }}>
                                <Home size={22} />
                                <span className={styles['bottom-nav-item-text-label']}>Quay về Trang chủ</span>
                            </Link>
                        ) : (
                            <>
                                <Link to="/" className={`${styles['bottom-nav-item']} ${isActive('/login') ? styles.active : ''}`} style={{ width: '25%' }}>
                                    <Home size={22} />
                                    <span className={styles['bottom-nav-item-text-label']}>Trang chủ</span>
                                </Link>
                                <Link to="/game-center" className={`${styles['bottom-nav-item']} ${isActive('/game-center') ? styles.active : ''}`} style={{ width: '25%' }}>
                                    <Calendar size={22} />
                                    <span className={styles['bottom-nav-item-text-label']}>GamesHub</span>
                                </Link>
                                <Link to="/login" className={`${styles['bottom-nav-item']} ${isActive('/login') ? styles.active : ''}`} style={{ width: '25%' }}>
                                    <LogIn size={22} />
                                    <span className={styles['bottom-nav-item-text-label']}>Đăng nhập</span>
                                </Link>
                                <Link to="/register" className={`${styles['bottom-nav-item']} ${isActive('/register') ? styles.active : ''}`} style={{ width: '25%' }}>
                                    <UserPlus size={22} />
                                    <span className={styles['bottom-nav-item-text-label']}>Đăng ký</span>
                                </Link>
                                <Link to="/magazine" className={`${styles['bottom-nav-item']} ${isActive('/magazine') ? styles.active : ''}`} style={{ width: '25%' }}>
                                    <BookOpen size={22} />
                                    <span className={styles['bottom-nav-item-text-label']}>Tạp chí</span>
                                </Link>
                                <Link to="/what-should-i-eat" className={`${styles['bottom-nav-item']} ${isActive('/what-should-i-eat') ? styles.active : ''}`} style={{ width: '25%' }}>
                                    <UtensilsCrossed size={22} />
                                    <span className={styles['bottom-nav-item-text-label']}>Ăn gì</span>
                                </Link>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};


export default BottomNav;


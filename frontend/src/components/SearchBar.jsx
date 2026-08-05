import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from '@/next-compat';
import { Search, X, Bell, Heart, MessageSquare, MessageCircle } from 'lucide-react';

const SearchBar = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchRef = useRef(null);
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const [isScrolled, setIsScrolled] = useState(false);
    const [navHeight, setNavHeight] = useState(0);

    // Notification toast state
    const [notification, setNotification] = useState(null);
    const [isNotifying, setIsNotifying] = useState(false);
    const notifTimeoutRef = useRef(null);
    const notifQueueRef = useRef([]);

    const getNotifIcon = (type) => {
        switch (type) {
            case 'Like': return <Heart size={16} style={{ color: '#ef4444' }} fill="#ef4444" />;
            case 'Comment': return <MessageCircle size={16} style={{ color: 'var(--primary)' }} />;
            case 'Reply': return <MessageCircle size={16} style={{ color: 'var(--primary)' }} />;
            case 'Message': return <MessageSquare size={16} style={{ color: 'var(--primary)' }} />;
            default: return <Bell size={16} style={{ color: 'var(--primary)' }} />;
        }
    };

    const showNotification = useCallback((data) => {
        // Don't show if search is open; queue it
        if (isSearchOpen) {
            notifQueueRef.current.push(data);
            return;
        }

        setNotification(data);
        setIsNotifying(true);

        // Clear any existing timeout
        if (notifTimeoutRef.current) {
            clearTimeout(notifTimeoutRef.current);
        }

        // Auto-dismiss after 4 seconds
        notifTimeoutRef.current = setTimeout(() => {
            setIsNotifying(false);
            setTimeout(() => setNotification(null), 500); // Wait for exit animation
        }, 4000);
    }, [isSearchOpen]);

    const dismissNotification = useCallback(() => {
        if (notifTimeoutRef.current) {
            clearTimeout(notifTimeoutRef.current);
        }
        setIsNotifying(false);
        setTimeout(() => setNotification(null), 500);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsSearchOpen(false);
            }
        };
        const handleOpenSearch = () => {
            setIsSearchOpen(true);
        };
        
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        const updateNavHeight = () => {
            const navbar = document.querySelector('.navbar');
            if (navbar && window.getComputedStyle(navbar).display !== 'none') {
                setNavHeight(navbar.offsetHeight);
            } else {
                setNavHeight(0);
            }
        };

        const handleDynamicIslandNotification = (e) => {
            showNotification(e.detail);
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('openSearch', handleOpenSearch);
        document.addEventListener('dynamicIslandNotification', handleDynamicIslandNotification);
        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', updateNavHeight);
        
        // Initial setup on mount
        updateNavHeight();
        handleScroll();
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('openSearch', handleOpenSearch);
            document.removeEventListener('dynamicIslandNotification', handleDynamicIslandNotification);
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', updateNavHeight);
            if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current);
        };
    }, [showNotification]);

    // When search closes, check if there are queued notifications
    useEffect(() => {
        if (!isSearchOpen && notifQueueRef.current.length > 0) {
            const next = notifQueueRef.current.shift();
            setTimeout(() => showNotification(next), 400);
        }
    }, [isSearchOpen, showNotification]);

    const handleSearch = (e) => {
        e.preventDefault();
        const q = searchQuery.trim();
        if (!q) return;
        navigate(`/search?q=${encodeURIComponent(q)}`);
        setIsSearchOpen(false);
        setSearchQuery('');
        closeMenu();
    };

    const closeMenu = () => setIsMenuOpen(false);

    // Determine Dynamic Island state
    const getIslandState = () => {
        if (isSearchOpen) return 'expanded';
        if (isNotifying && notification) return 'notifying';
        return 'collapsed';
    };

    const islandState = getIslandState();

    const getAvatarUrl = (notif) => {
        if (notif.senderProfilePicture) return notif.senderProfilePicture;
        if (notif.sendercartoonCharacter) return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/cartoon/${notif.sendercartoonCharacter}.png`;
        return null;
    };

    return (
        <div className="search-bar-wrapper" style={{ position: 'sticky', top: `${navHeight}px`, zIndex: 8999 }}>
            {/* blur overlay when scrolled */}
            <div 
                className='search-bar-overlay'
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backdropFilter: isScrolled ? 'blur(10px)' : 'none',
                    WebkitBackdropFilter: isScrolled ? 'blur(10px)' : 'none',
                    backgroundColor: isScrolled ? 'rgb(142 145 149 / 0%)' : 'transparent',
                    borderBottom: isScrolled ? '1px solid rgb(142 145 149 / 0%)' : '1px solid transparent',
                    transition: 'all 0.3s ease',
                    zIndex: -1,
                    pointerEvents: 'none'
                }}
            />
            <div className='search-bar-container' style={{ padding: '0.5rem 0', display: 'flex', justifyContent: 'center' }}>
                
                {/* Invisible trap overlay to close search and prevent underlying clicks */}
                {isSearchOpen && (
                    <div 
                        style={{
                            position: 'fixed',
                            top: 0, left: 0, right: 0, bottom: 0,
                            zIndex: 9000,
                            cursor: 'default'
                        }}
                        onClick={() => setIsSearchOpen(false)}
                    />
                )}

                <div 
                    className={`dynamic-island-wrapper ${islandState}`}
                    onClick={() => {
                        if (islandState === 'collapsed') setIsSearchOpen(true);
                        if (islandState === 'notifying') {
                            dismissNotification();
                            if (notification.type === 'Message') {
                                navigate('/chat');
                            } else if (notification.type === 'Like' || notification.type === 'Comment' || notification.type === 'Reply') {
                                navigate(`/post/${notification.relatedItemSlug || notification.relatedItemId}`);
                            } else {
                                navigate('/notifications');
                            }
                        }
                    }}
                    ref={searchRef}
                    style={{ zIndex: 9001 }}
                >
                    {/* Left icon area */}
                    <div className="dynamic-island-search-icon">
                        {islandState === 'notifying' && notification ? (
                            (() => {
                                const avatar = getAvatarUrl(notification);
                                return avatar ? (
                                    <img 
                                        src={avatar} 
                                        alt="" 
                                        className="dynamic-island-notif-avatar"
                                    />
                                ) : (
                                    <Bell size={16} color="white" />
                                );
                            })()
                        ) : (
                            <Search size={isSearchOpen ? 20 : 16} color={isSearchOpen ? "black" : "var(--text-main)"} />
                        )}
                    </div>
                    
                    <div className="dynamic-island-main">
                        {islandState === 'collapsed' && (
                             <div className="dynamic-island-content-collapsed">
                                 <span style={{ marginLeft: '4px' }}>Tìm kiếm nội dung</span>
                             </div>
                        )}
                        
                        {islandState === 'expanded' && (
                             <form onSubmit={handleSearch} className="dynamic-island-form">
                                 <input
                                     id="dynamic-search-input"
                                     type="text"
                                     className="dynamic-island-input"
                                     placeholder="Hãy thử `mewtwo` và Enter"
                                     value={searchQuery}
                                     onChange={e => setSearchQuery(e.target.value)}
                                     autoFocus={isSearchOpen}
                                     autoComplete='off'
                                 />
                                 <button
                                     type="button"
                                     aria-label="Đóng tìm kiếm"
                                     className="dynamic-island-close-btn"
                                     onClick={(e) => {
                                          e.stopPropagation();
                                          setIsSearchOpen(false);
                                     }}
                                 >
                                     <X size={20} />
                                 </button>
                             </form>
                        )}

                        {islandState === 'notifying' && notification && (
                            <div className="dynamic-island-notif-content">
                                <div className="dynamic-island-notif-icon">
                                    {getNotifIcon(notification.type)}
                                </div>
                                <div className="dynamic-island-notif-text">
                                    <span className="dynamic-island-notif-sender">{notification.senderName}</span>
                                    <span className="dynamic-island-notif-message">
                                        {notification.content.replace(notification.senderName, '').trim()}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    aria-label="Đóng thông báo"
                                    className="dynamic-island-close-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        dismissNotification();
                                    }}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchBar;

'use client';
import React, { useEffect } from 'react';
import { useNavigate } from '@/next-compat';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Bell, Check, MessageSquare, Heart, MessageCircle } from 'lucide-react';

const Notifications = () => {
    const { user } = useAuth();
    const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } = useNotifications();
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'Thông báo | BlogSocial';
        if (!user) {
            navigate('/login');
        }
        fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const getIcon = (type) => {
        switch (type) {
            case 'Message': return <MessageSquare size={18} className="text-primary" />;
            case 'Like': return <Heart size={18} style={{ color: '#ef4444' }} fill="#ef4444" />;
            case 'Comment': return <MessageCircle size={18} style={{ color: 'var(--primary)' }} />;
            case 'Reply': return <MessageCircle size={18} style={{ color: 'var(--primary)' }} />;
            default: return <Bell size={18} />;
        }
    };

    const handleNotifClick = (n) => {
        markAsRead(n.id);
        if (n.type === 'Message') navigate('/chat');
        else if (n.type === 'Like' || n.type === 'Comment' || n.type === 'Reply') navigate(`/post/${n.relatedItemSlug || n.relatedItemId}`);
        else navigate('/');
    };

    return (
        <div className="container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>Thông báo</h1>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="nav-link mark-as-read-notifi-btn"
                        style={{ background: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 300, fontSize: '1rem' }}
                    >
                        <Check size={18} style={{ marginRight: '4px' }} /> Đánh dấu đã đọc tất cả
                    </button>
                )}
            </div>

            <div className="notification-full-list">
                {notifications.length > 0 ? (
                    notifications.map(n => (
                        <div
                            key={n.id}
                            className={`notification-card ${n.isRead ? '' : 'unread'}`}
                            onClick={() => handleNotifClick(n)}
                            style={{
                                background: 'var(--card-dark)',
                                border: '1px solid var(--border)',
                                borderRadius: '1rem',
                                padding: '1.25rem',
                                marginBottom: '1rem',
                                display: 'flex',
                                gap: '1rem',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                borderLeft: n.isRead ? '' : '3px solid var(--primary)'
                            }}
                        >
                            <div style={{ position: 'relative' }}>
                                <img
                                    src={n.senderProfilePicture || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/cartoon/${n.sendercartoonCharacter}.png`}
                                    className="avatar"
                                    style={{ width: '48px', height: '48px' }}
                                    alt="Notification"
                                />
                                <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', background: 'var(--card-dark)', borderRadius: '50%', padding: '2px' }}>
                                    {getIcon(n.type)}
                                </div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '1rem', marginBottom: '0.25rem', color: 'var(--text-main)' }}>
                                    <strong>{n.senderName}</strong> {n.content.replace(n.senderName, '').trim()}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    {formatDistanceToNow(new Date(n.createdAt.endsWith('Z') ? n.createdAt : n.createdAt + 'Z'), { addSuffix: true, locale: vi })}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--card-dark)', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                        <Bell size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
                        <p style={{ color: 'var(--text-muted)' }}>Bạn không có thông báo nào mới.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;



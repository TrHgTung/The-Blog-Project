'use client';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { useAuth } from './AuthContext';
import api from '../services/api';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [connection, setConnection] = useState(null);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        try {
            const response = await api.get('/notifications');
            setNotifications(response.data);
            setUnreadCount(response.data.filter(n => !n.isRead).length);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }, [user]);

    useEffect(() => {
        if (user && user.token) {
            fetchNotifications();

            const hubUrl = api.defaults.baseURL.replace('/api', '/notificationhub');
            const newConnection = new HubConnectionBuilder()
                .withUrl(hubUrl, {
                    accessTokenFactory: () => user.token
                })
                .withAutomaticReconnect()
                .configureLogging(LogLevel.Information)
                .build();

            setConnection(newConnection);
        } else {
            if (connection) {
                connection.stop();
                setConnection(null);
            }
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [user]);

    useEffect(() => {
        if (connection) {
            connection.start()
                .then(() => {
                    console.log('Connected to NotificationHub');
                    connection.on('ReceiveNotification', (rawNotification) => {
                        // Normalize keys in case SignalR sends PascalCase
                        const notification = {
                            ...rawNotification,
                            id: rawNotification.id || rawNotification.Id,
                            content: rawNotification.content || rawNotification.Content,
                            type: rawNotification.type || rawNotification.Type,
                            isRead: rawNotification.isRead || rawNotification.IsRead,
                            createdAt: rawNotification.createdAt || rawNotification.CreatedAt,
                            senderId: rawNotification.senderId || rawNotification.SenderId,
                            senderName: rawNotification.senderName || rawNotification.SenderName,
                            senderProfilePicture: rawNotification.senderProfilePicture || rawNotification.SenderProfilePicture,
                            sendercartoonCharacter: rawNotification.sendercartoonCharacter || rawNotification.SendercartoonCharacter,
                            relatedItemId: rawNotification.relatedItemId || rawNotification.RelatedItemId,
                            relatedItemSlug: rawNotification.relatedItemSlug || rawNotification.RelatedItemSlug
                        };

                        setNotifications(prev => [notification, ...prev]);
                        setUnreadCount(prev => prev + 1);

                        // Dispatch event to Dynamic Island for inline toast
                        document.dispatchEvent(new CustomEvent('dynamicIslandNotification', {
                            detail: {
                                senderName: notification.senderName || 'Ai đó',
                                content: (notification.type === 'message' || notification.type === 'Message') ? 'bạn có tin nhắn mới' : (notification.content || 'Bạn có thông báo mới'),
                                type: notification.type || 'General',
                                senderProfilePicture: notification.senderProfilePicture,
                                sendercartoonCharacter: notification.sendercartoonCharacter,
                                relatedItemId: notification.relatedItemId || notification.RelatedItemId,
                                relatedItemSlug: notification.relatedItemSlug || notification.RelatedItemSlug,
                                id: notification.id || notification.Id
                            }
                        }));

                        // Optional: Show a browser notification or toast
                        if (Notification.permission === 'granted') {
                            new Notification('Thông báo mới', {
                                body: notification.content,
                                icon: '/favicon.png'
                            });
                        }
                    });
                })
                .catch(e => console.log('Connection failed: ', e));
        }
    }, [connection]);

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);



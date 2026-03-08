import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import * as signalR from '@microsoft/signalr';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Send, Users, User, MessageCircle } from 'lucide-react';

const ChatPage = () => {
    const { user: currentUser } = useAuth();
    const location = useLocation();
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [connection, setConnection] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (location.state?.startWithUser) {
            const startUser = location.state.startWithUser;
            const normalizedStartUser = {
                ...startUser,
                id: (startUser.id || startUser.Id || "").toLowerCase()
            };
            setSelectedUser(normalizedStartUser);
            setUsers(prev => {
                if (!prev.find(u => u.id === normalizedStartUser.id)) {
                    return [normalizedStartUser, ...prev];
                }
                return prev;
            });
        }
    }, [location.state]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await api.get('/api/user-service/UserRelationship/online-user');
                // Normalize user objects to have a lowercase 'id'
                const normalizedUsers = (response.data || []).map(u => ({
                    ...u,
                    id: String(u.id || u.Id || "").toLowerCase()
                }));
                setUsers(normalizedUsers);
            } catch (err) {
                console.error('Error fetching users:', err);
            }
        };

        fetchUsers();

        const token = localStorage.getItem('token');
        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl("/chatHub", {
                accessTokenFactory: () => token
            })
            .withAutomaticReconnect()
            // .configureLogging(signalR.LogLevel.Information)
            .build();

        setConnection(newConnection);
    }, []);

    useEffect(() => {
        if (connection) {
            const startConnection = async () => {
                try {
                    if (connection.state === signalR.HubConnectionState.Disconnected) {
                        await connection.start();
                        console.log('Connected to SignalR Hub! (State: ' + connection.state + ')');
                        setIsConnected(true);
                        setConnectionError(null);

                        connection.off("ReceiveMessage");
                        connection.on("ReceiveMessage", (senderId, receiverId, message) => {
                            if (!senderId || !receiverId) return;
                            setMessages(prev => [...prev, {
                                senderId: senderId.toLowerCase(),
                                receiverId: receiverId.toLowerCase(),
                                content: message,
                                timestamp: new Date().toISOString()
                            }]);
                        });

                        connection.off("ReceiveChatHistory");
                        connection.on("ReceiveChatHistory", (history) => {
                            if (!Array.isArray(history)) return;
                            const normalizedHistory = history.map(h => ({
                                ...h,
                                senderId: (h.senderId || h.SenderId || "").toLowerCase(),
                                receiverId: (h.receiverId || h.ReceiverId || "").toLowerCase()
                            }));
                            setMessages(normalizedHistory);
                        });
                    } else if (connection.state === signalR.HubConnectionState.Connected) {
                        setIsConnected(true);
                    }
                } catch (err) {
                    console.error('SignalR Connection Error: ', err);
                    setConnectionError(err.toString());
                }
            };

            startConnection();
        }
    }, [connection]);

    useEffect(() => {
        const fetchHistory = async () => {
            if (connection && isConnected && selectedUser) {
                const targetId = (selectedUser.id || selectedUser.Id)?.toString();
                if (!targetId) return;
                try {
                    await connection.invoke("LoadChatHistory", targetId);
                } catch (err) {
                    console.error('Error loading history:', err);
                }
            }
        };

        fetchHistory();
    }, [selectedUser, connection, isConnected]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || !selectedUser || !connection) return;

        if (connection.state !== signalR.HubConnectionState.Connected) {
            const errMsg = `Mất kết nối. Trạng thái: ${connection.state}. Lỗi: ${connectionError || 'Không rõ'}`;
            console.error(errMsg);
            alert(errMsg);
            return;
        }

        try {
            const targetId = (selectedUser.id || selectedUser.Id)?.toString();
            if (!targetId) return;

            await connection.invoke("SendPrivateMessage", targetId, inputMessage);

            setMessages(prev => [...prev, {
                senderId: (currentUser?.id || "").toLowerCase(),
                receiverId: targetId.toLowerCase(),
                content: inputMessage,
                timestamp: new Date().toISOString()
            }]);

            setInputMessage('');
        } catch (err) {
            console.error('Error sending message:', err);
        }
    };

    return (
        <div className="chat-container glass-card">
            {connectionError && (
                <div className="error-banner" style={{ background: '#ff4d4d', color: 'white', padding: '10px', textAlign: 'center' }}>
                    Lỗi kết nối Server Chat: {connectionError}. Vui lòng kiểm tra Log F12.
                </div>
            )}
            <div className="chat-layout">
                {/* Users Sidebar */}
                <div className="chat-sidebar">
                    <div className="sidebar-header">
                        <Users size={20} />
                        <h3>Recent Chats</h3>
                    </div>
                    <div className="users-list">
                        {users.map(u => (
                            <div
                                key={u.id}
                                className={`user-item ${selectedUser?.id === u.id ? 'active' : ''}`}
                                onClick={() => setSelectedUser(u)}
                            >
                                <img
                                    src={u.avatarImage || `https://ui-avatars.com/api/?name=${u.username}&background=random`}
                                    alt={u.username}
                                    className="user-avatar"
                                />
                                <div className="user-info">
                                    <div className="user-name">{u.firstName} {u.lastName}</div>
                                    <div className="user-status">Online</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat Window */}
                <div className="chat-window">
                    {selectedUser ? (
                        <>
                            <div className="chat-header">
                                <div className="selected-user">
                                    <img
                                        src={selectedUser.avatarImage || `https://ui-avatars.com/api/?name=${selectedUser.username}&background=random`}
                                        alt={selectedUser.username}
                                    />
                                    <div>
                                        <h4>{selectedUser.firstName} {selectedUser.lastName}</h4>
                                        <p>Active now</p>
                                    </div>
                                </div>
                            </div>

                            <div className="messages-container">
                                {messages.filter(m => {
                                    const mSenderId = (m.senderId || "").toLowerCase();
                                    const mReceiverId = (m.receiverId || "").toLowerCase();
                                    const selectedId = (selectedUser.id || selectedUser.Id || "").toString().toLowerCase();
                                    const currentId = (currentUser?.id || "").toLowerCase();
                                    return (mSenderId === selectedId || mSenderId === currentId) && (mReceiverId === selectedId || mReceiverId === currentId);
                                }).map((m, idx) => {
                                    const isSent = (m.senderId || "").toLowerCase() === (currentUser?.id || "").toLowerCase();
                                    return (
                                        <div key={idx} className={`message-wrapper ${isSent ? 'sent' : 'received'}`}>
                                            <div className="message-bubble">
                                                {m.content}
                                            </div>
                                            <div className="message-time">
                                                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            <form className="chat-input-area" onSubmit={sendMessage}>
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                />
                                <button type="submit" className="send-btn" disabled={!inputMessage.trim()}>
                                    <Send size={20} />
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="no-chat-selected">
                            <MessageCircle size={64} />
                            <h3>Select a user to start chatting</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatPage;

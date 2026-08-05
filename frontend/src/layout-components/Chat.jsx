'use client';
import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from '@/next-compat';
import * as signalR from '@microsoft/signalr';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Send, User } from 'lucide-react';
import { format } from 'date-fns';

const Chat = () => {
    const { user: currentUser } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const targetUserId = queryParams.get('userId');

    const [connection, setConnection] = useState(null);
    const [chats, setChats] = useState([]); // List of users to chat with
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);
    const messageListRef = useRef(null);
    const isFirstLoad = useRef(true);


    // Scroll to bottom
    const scrollToBottom = (behavior = 'smooth') => {
        if (messageListRef.current) {
            messageListRef.current.scrollTo({
                top: messageListRef.current.scrollHeight,
                behavior: behavior
            });
        }
    };

    useEffect(() => {
        if (messages.length > 0) {
            if (isFirstLoad.current) {
                scrollToBottom('instant');
                isFirstLoad.current = false;
            } else {
                scrollToBottom('smooth');
            }
        }
    }, [messages]);


    // Fetch chat partners
    const fetchChatPartners = async () => {
        try {
            const [followingRes, conversationsRes] = await Promise.all([
                api.get(`/follows/following/${currentUser.id}`),
                api.get('/chat/conversations')
            ]);

            // Merge and remove duplicates
            const allPartners = [...followingRes.data, ...conversationsRes.data];
            const uniquePartners = Array.from(new Map(allPartners.map(p => [p.id, p])).values());

            // If we targeted a user from URL, ensure they are in the list
            let finalPartners = uniquePartners;
            if (targetUserId) {
                const isTargetPresent = finalPartners.some(p => p.id === targetUserId);
                if (!isTargetPresent) {
                    try {
                        const postsRes = await api.get('/posts');
                        const targetPost = postsRes.data.find(p => p.authorId === targetUserId);
                        if (targetPost) {
                            const targetUser = {
                                id: targetPost.authorId,
                                displayName: targetPost.authorName,
                                profilePicture: targetPost.authorProfilePicture,
                                cartoonCharacter: targetPost.authorcartoonCharacter
                            };
                            finalPartners = [targetUser, ...finalPartners];
                        }
                    } catch (err) {
                        console.error('Failed to fetch target user info', err);
                    }
                }
                const target = finalPartners.find(p => p.id === targetUserId);
                if (target) setSelectedUser(target);
            }

            setChats(finalPartners);
        } catch (err) {
            console.error('Failed to fetch chat partners', err);
        }
    };

    useEffect(() => {
        fetchChatPartners();
    }, [currentUser.id, targetUserId]);

    const chatsRef = useRef([]);
    useEffect(() => {
        chatsRef.current = chats;
    }, [chats]);

    const selectedUserRef = useRef(null);
    useEffect(() => {
        selectedUserRef.current = selectedUser;
    }, [selectedUser]);

    // SignalR Setup
    useEffect(() => {
        const hubUrl = api.defaults.baseURL.replace('/api', '/chathub');
        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                accessTokenFactory: () => currentUser.token
            })
            .withAutomaticReconnect()
            .build();

        setConnection(newConnection);
    }, [currentUser.token]);

    useEffect(() => {
        if (connection) {
            connection.start()
                .then(() => {
                    console.log('Connected to ChatHub');
                    // Remove existing handlers if any to avoid duplicates on reconnect
                    connection.off("ReceiveMessage");
                    connection.on("ReceiveMessage", (message) => {
                        const selUser = selectedUserRef.current;
                        const currentChats = chatsRef.current;

                        // Normalize for comparison
                        const senderId = message.senderId?.toLowerCase();
                        const receiverId = message.receiverId?.toLowerCase();
                        const selUserId = selUser?.id?.toLowerCase();

                        // If message is from/to selected user, add to messages
                        if (selUser && (senderId === selUserId || receiverId === selUserId)) {
                            setMessages(prev => [...prev, message]);
                        } else {
                            // If message is from someone not in our sidebar, refresh sidebar
                            const isKnown = currentChats.some(c => c.id?.toLowerCase() === senderId);
                            if (!isKnown) {
                                fetchChatPartners();
                            }
                            console.log("New message from another user:", senderId);
                        }
                    });
                })
                .catch(e => console.log('Connection failed: ', e));

            return () => {
                connection.off("ReceiveMessage");
                connection.stop();
            };
        }
    }, [connection]);

    // Fetch history when user selected
    useEffect(() => {
        if (selectedUser) {
            isFirstLoad.current = true; // Reset for new user
            setMessages([]); // Clear previous messages

            const fetchHistory = async () => {
                try {
                    const res = await api.get(`/chat/${selectedUser.id}`);
                    setMessages(res.data);
                } catch (err) {
                    console.error('Failed to fetch chat history', err);
                }
            };
            fetchHistory();
        }
    }, [selectedUser]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        const trimmed = newMessage.trim();
        if (!trimmed || !selectedUser || !connection) return;
        if (trimmed.length > 1000) {
            alert('Tin nhắn quá dài! Tối đa 1000 ký tự.');
            return;
        }

        try {
            // Check connection state before sending
            if (connection.state !== signalR.HubConnectionState.Connected) {
                if (connection.state === signalR.HubConnectionState.Disconnected) {
                    await connection.start();
                } else if (connection.state === signalR.HubConnectionState.Connecting || connection.state === signalR.HubConnectionState.Reconnecting) {
                    // Wait a bit and retry once if it's already connecting
                    let retries = 0;
                    while (connection.state !== signalR.HubConnectionState.Connected && retries < 5) {
                        await new Promise(r => setTimeout(r, 500));
                        retries++;
                    }
                    if (connection.state !== signalR.HubConnectionState.Connected) {
                        throw new Error("Vẫn chưa thể kết nối tới máy chủ. Vui lòng đợi trong giây lát.");
                    }
                }
            }

            await connection.invoke("SendMessage", selectedUser.id, trimmed);
            setNewMessage('');
        } catch (err) {
            console.error('Failed to send message', err);
            alert(err.message || 'Failed to send message. Make sure you are following this user.');
        }
    };

    return (
        <div className="container" style={{ padding: 0, margin: 0, width: '100%', maxWidth: '100%' }}>
            <div className={`chat-container ${selectedUser ? 'has-selected' : ''}`}>
                {/* Sidebar */}
                <div className="chat-sidebar">
                    <div style={{ padding: '1rem 0.5rem 0.25rem 0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Tin nhắn gần đây</div>
                    <p style={{ padding: '0.25rem 1rem 1rem 0.5rem', borderBottom: '1px solid var(--border)', fontWeight: 300, fontSize: '0.7rem', fontStyle: 'italic', textAlign: 'justify', color: 'var(--text-muted)' }}>Các tin nhắn không được mã hóa đầu cuối, vui lòng không nhắn các thông tin cá nhân qua nền tảng!</p>
                    {chats.map(partner => (
                        <div
                            key={partner.id}
                            className={`nav-link custom-nav-link`}
                            style={{
                                padding: '1rem',
                                cursor: 'pointer',
                                background: selectedUser?.id?.toLowerCase() === partner.id?.toLowerCase() ? 'var(--border)' : 'transparent',
                                borderRadius: 0,
                                borderBottom: '1px solid var(--border)',
                                width: '100%'
                            }}
                            onClick={() => setSelectedUser(partner)}
                        >
                            <img
                                src={partner.profilePicture || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/cartoon/${partner.cartoonCharacter}.png`}
                                className="avatar"
                                style={{ width: '30px', height: '30px' }}
                                alt={partner.displayName}
                            />
                            <span>{partner.displayName}</span>
                        </div>
                    ))}
                </div>

                {/* Main Chat */}
                <div className="chat-main">
                    {selectedUser ? (
                        <>
                            <div className='mobile-back-btn-containr' style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
                                <button
                                    className="mobile-back-btn"
                                    onClick={() => setSelectedUser(null)}
                                    style={{ background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', padding: '0.5rem', display: 'none' }}
                                >
                                    ←
                                </button>
                                <img
                                    src={selectedUser.profilePicture || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/cartoon/${selectedUser.cartoonCharacter}.png`}
                                    className="avatar"
                                    style={{ width: '30px', height: '30px' }}
                                    alt={selectedUser.displayName}
                                />
                                <div style={{ fontWeight: 600 }}>{selectedUser.displayName}</div>

                                <button
                                    onClick={() => navigate(`/profile/${selectedUser.id}`)}
                                    style={{
                                        marginLeft: 'auto',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid var(--border)',
                                        color: 'var(--text-main)',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.85rem',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.background = 'var(--primary)';
                                        e.currentTarget.style.color = 'white';
                                        e.currentTarget.style.borderColor = 'transparent';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.3)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                        e.currentTarget.style.color = 'var(--text-main)';
                                        e.currentTarget.style.borderColor = 'var(--border)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <User size={16} /> <span className="profile-btn-text">Xem hồ sơ và theo dõi</span>
                                </button>
                            </div>
                            <div className="message-list" ref={messageListRef}>

                                {messages.map((m, i) => (
                                    <div
                                        key={m.id || i}
                                        className={`message ${m.senderId === currentUser.id ? 'sent' : 'received'}`}
                                    >
                                        <div>{m.message}</div>
                                        <div style={{ fontSize: '0.65rem', opacity: 0.7, marginTop: '0.25rem', textAlign: 'right' }}>
                                            {format(new Date(m.sentAt), 'HH:mm')}
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                            <form className="chat-input-area" onSubmit={handleSendMessage}>
                                <input
                                    className="form-input"
                                    placeholder={`Gửi tin nhắn đến ${selectedUser.displayName}...`}
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    maxLength={1000}
                                />
                                <button type="submit" className="auth-btn" style={{ width: 'auto', marginTop: 0 }}>
                                    <Send size={20} />
                                </button>
                            </form>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            Chọn một người bạn theo dõi để bắt đầu trò chuyện
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Chat;

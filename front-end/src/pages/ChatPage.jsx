import React, { useState, useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Send, Users, User, MessageCircle } from 'lucide-react';

const ChatPage = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [connection, setConnection] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        // Fetch available users to chat with
        const fetchUsers = async () => {
            try {
                const response = await api.get('/api/user-service/UserRelationship/available-users-in-feed');
                setUsers(response.data);
            } catch (err) {
                console.error('Error fetching users:', err);
            }
        };

        fetchUsers();

        // Initialize SignalR connection
        const token = localStorage.getItem('token');
        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl("/chatHub", {
                accessTokenFactory: () => token
            })
            .withAutomaticReconnect()
            .build();

        setConnection(newConnection);
    }, []);

    useEffect(() => {
        if (connection) {
            connection.start()
                .then(() => {
                    console.log('Connected to SignalR Hub!');

                    connection.on("ReceiveMessage", (senderId, message) => {
                        // If selectedUser matches senderId, add to messages
                        // Otherwise, maybe show a notification
                        setMessages(prev => [...prev, {
                            senderId,
                            content: message,
                            timestamp: new Date().toISOString()
                        }]);
                    });
                })
                .catch(err => console.error('SignalR Connection Error: ', err));
        }

        return () => {
            if (connection) {
                connection.stop();
            }
        };
    }, [connection]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || !selectedUser || !connection) return;

        try {
            await connection.invoke("SendPrivateMessage", selectedUser.id.toString(), inputMessage);

            // Add my own message to the chat
            setMessages(prev => [...prev, {
                senderId: currentUser.id,
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
                                {messages.filter(m => (m.senderId === selectedUser.id || m.senderId === currentUser.id)).map((m, idx) => (
                                    <div key={idx} className={`message-wrapper ${m.senderId === currentUser.id ? 'sent' : 'received'}`}>
                                        <div className="message-bubble">
                                            {m.content}
                                        </div>
                                        <div className="message-time">
                                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                ))}
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

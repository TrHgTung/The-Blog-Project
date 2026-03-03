import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, Check, Info } from 'lucide-react';

const GroupsPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [groups, setGroups] = useState([]);
    const [joinedIds, setJoinedIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [groupsRes, joinedRes] = await Promise.all([
                    api.get('/api/user-service/UserRecommendation/get-all-topics'),
                    api.get('/api/user-service/Topic/my-joined-topic-ids')
                ]);
                setGroups(groupsRes.data);
                setJoinedIds(joinedRes.data);
            } catch (err) {
                console.error('Error fetching groups data:', err);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchData();
        } else {
            api.get('/api/user-service/UserRecommendation/get-all-topics')
                .then(res => setGroups(res.data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [user]);

    const handleJoin = async (groupId) => {
        if (!user) {
            navigate('/login');
            return;
        }

        setActionLoading(groupId);
        try {
            await api.post(`/api/user-service/Topic/join-to-topic/${groupId}`);
            setJoinedIds(prev => [...prev, groupId]);
        } catch (err) {
            console.error('Failed to join group:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleLeave = async (groupId) => {
        setActionLoading(groupId);
        try {
            await api.patch(`/api/user-service/Topic/leave-topic/${groupId}`);
            setJoinedIds(prev => prev.filter(id => id !== groupId));
        } catch (err) {
            console.error('Failed to leave group:', err);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <div className="loading">Đang tải danh sách nhóm...</div>;

    return (
        <div className="groups-page">
            <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="header-info">
                    <h1>Khám phá các Nhóm</h1>
                    <p>Tìm kiếm và tham gia vào những cộng đồng phù hợp với sở thích của bạn.</p>
                </div>
                {user && (
                    <button className="btn btn-primary" onClick={() => navigate('/create-group')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={18} /> Tạo Nhóm mới
                    </button>
                )}
            </header>

            <div className="groups-grid">
                {groups.map(group => {
                    const isJoined = joinedIds.includes(group.id);
                    return (
                        <div key={group.id} className="group-card glass-card">
                            <div className="group-banner" style={{ backgroundColor: group.topicBackgroundColor || 'var(--primary)' }}>
                                {group.topicName[0]}
                            </div>
                            <div className="group-content">
                                <h3 className="group-name">{group.topicName}</h3>
                                <p className="group-desc">{group.topicDescription}</p>
                                <div className="group-actions">
                                    <button
                                        className="btn-info"
                                        onClick={() => navigate(`/group/${group.id}`)}
                                        title="Chi tiết"
                                    >
                                        <Info size={18} />
                                    </button>
                                    {isJoined ? (
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => handleLeave(group.id)}
                                            disabled={actionLoading === group.id}
                                        >
                                            <Check size={16} /> Đã tham gia
                                        </button>
                                    ) : (
                                        <button
                                            className="btn"
                                            onClick={() => handleJoin(group.id)}
                                            disabled={actionLoading === group.id}
                                        >
                                            <Plus size={16} /> Tham gia
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <style>{`
                .groups-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 2rem;
                    margin-top: 2rem;
                }
                .group-card {
                    padding: 0;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    transition: transform 0.3s ease;
                }
                .group-card:hover {
                    transform: translateY(-5px);
                }
                .group-banner {
                    height: 100px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 3rem;
                    font-weight: bold;
                    color: white;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                .group-content {
                    padding: 1.5rem;
                }
                .group-name {
                    margin: 0 0 0.5rem 0;
                    color: var(--text-main);
                }
                .group-desc {
                    font-size: 0.9rem;
                    color: var(--text-muted);
                    margin-bottom: 1.5rem;
                    height: 3.6em;
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                }
                .group-actions {
                    display: flex;
                    gap: 0.75rem;
                }
                .btn-info {
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid var(--glass-border);
                    color: var(--text-main);
                    padding: 0.5rem;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .btn-info:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                .btn-secondary {
                    background: rgba(16, 185, 129, 0.2);
                    color: #10b981;
                    border: 1px solid rgba(16, 185, 129, 0.3);
                }
                .btn-secondary:hover {
                    background: rgba(16, 185, 129, 0.3);
                }
            `}</style>
        </div>
    );
};

export default GroupsPage;

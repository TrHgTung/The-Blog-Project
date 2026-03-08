import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, Check, Info } from 'lucide-react';
import '../style/groupPage.css';
import { Link } from 'react-router-dom';

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
                {groups.length > 0 ? (
                    groups.map(group => {
                        const isJoined = joinedIds.includes(group.id);
                        return (
                            <div key={group.id} className="group-card glass-card glass-card-psuedo">
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
                    })
                ) : (
                    // Hiển thị thẻ giả khi không có dữ liệu
                    [1].map((i) => (
                        <div key={i} className="group-card glass-card glass-card-psuedo skeleton-card" style={{ opacity: 0.7 }}>
                            <div className="group-banner" style={{ backgroundColor: '#2d3748', filter: 'grayscale(1)' }}>
                                ?
                            </div>
                            <div className="group-content">
                                <h3 className="group-name">Một con mèo màu cam</h3>
                                <p className="group-desc">Hãy đăng nhập vào <Link to="/login" style={{ textDecoration: "none", color: "white" }}>The Blog Social</Link> để tham gia nhóm cùng với mọi người, và hơn thế nữa.</p>
                                <div className="group-actions">
                                    <Link to="/login" className="btn btn-psuedo-group" >
                                        <Plus size={16} /> Tham gia ngay
                                    </Link>
                                    <Link to="/login" className="btn-info btn-psuedo-group" >
                                        <Info size={18} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div >
    );
};

export default GroupsPage;

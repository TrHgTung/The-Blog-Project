'use client';
import { useState, useEffect } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Users, UserPlus, UserMinus, Info, PlusSquare } from 'lucide-react';
import { Link } from '@/next-compat';

const Groups = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newGroup, setNewGroup] = useState({ name: '', description: '' });

    useEffect(() => {
        document.title = 'Cộng đồng | BlogSocial';
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const response = await api.get('/groups');
            setGroups(response.data);
        } catch (err) {
            setError('Failed to fetch groups');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        try {
            const headers = { 'X-Idempotency-Key': crypto.randomUUID() };
            await api.post('/groups', newGroup, { headers });
            setNewGroup({ name: '', description: '' });
            setShowCreateForm(false);
            fetchGroups();
        } catch (err) {
            alert('Failed to create group');
        }
    };

    const handleJoinLeave = async (e, group) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const headers = { 'X-Idempotency-Key': crypto.randomUUID() };
            if (group.isMember) {
                await api.post(`/groups/${group.id}/leave`, {}, { headers });
            } else {
                await api.post(`/groups/${group.id}/join`, {}, { headers });
            }
            fetchGroups(); // Refresh status
        } catch (err) {
            alert('Operation failed');
        }
    };

    if (loading) return <div className="container maybe-is-birthday-card">Đang tải dữ liệu...</div>;

    return (
        <div className="container">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="page-header"
                style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}
            >
                <div>
                    <h1>Khám phá Cộng đồng</h1>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }} className="join-subtitle">
                        Tham gia nhiều cộng đồng hơn để phủ kín bảng tin của bạn
                    </div>
                </div>
                <button
                    className="nav-register-btn"
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    style={{ padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <PlusSquare size={18} /> {showCreateForm ? 'Hủy' : 'Tạo Cộng đồng cho riêng bạn'}
                </button>
            </motion.div>

            {showCreateForm && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="auth-card"
                    style={{ maxWidth: 'none', marginBottom: '2rem', background: 'var(--bg-dark)' }}
                >
                    <h2 style={{ marginBottom: '1.5rem' }}>Tạo Cộng đồng mới</h2>
                    <form onSubmit={handleCreateGroup}>
                        <div className="form-group">
                            <label className="form-label">Tên Cộng đồng</label>
                            <input
                                className="form-input"
                                value={newGroup.name}
                                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                                required
                                maxLength={50}
                                placeholder="Một cái tên ấn tượng..."
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Mô tả ngắn về chủ đề cộng đồng hướng tới</label>
                            <textarea
                                className="form-input"
                                style={{ minHeight: '100px' }}
                                value={newGroup.description}
                                onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                                required
                                maxLength={200}
                                placeholder="Cộng đồng này đang hướng tới điều gì..."
                            />
                        </div>
                        <button className="auth-btn" type="submit">Tạo và Tham gia</button>
                    </form>
                </motion.div>
            )}

            {error && <div className="error-msg">{error}</div>}
            <h3>Cộng đồng được đề xuất dành cho bạn</h3>
            <div className='groups-container' style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
                {groups.map((group, index) => (
                    <motion.div
                        key={group.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <Link to={`/groups/${group.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div className="auth-card groups-container__group-cards" style={{ maxWidth: 'none', padding: '1.5rem', position: 'relative', height: '100%' }}>
                                {index < 3 && !group.isMember && (
                                    <div className='auth-card__group-card--special' style={{
                                        position: 'absolute',
                                        top: '1rem',
                                        right: '1rem',
                                        background: 'var(--primary)',
                                        color: 'white',
                                        fontSize: '0.7rem',
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '4px',
                                        fontWeight: 'bold'
                                    }}>
                                        Được đề xuất
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '12px',
                                        background: 'var(--primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <Users size={30} color="white" />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ margin: '0', textAlign: 'left' }}>{group.name}</h3>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0', minHeight: '40px', textAlign: 'left' }}>
                                            {group.description || 'Không có mô tả.'}
                                        </p>
                                        <div className="member-count-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span className="member-count" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                                                {group.memberCount} thành viên
                                            </span>
                                            <button
                                                onClick={(e) => handleJoinLeave(e, group)}
                                                className={group.isMember ? 'nav-logout-btn' : 'nav-register-btn'}
                                                style={{
                                                    padding: '0.4rem 1rem',
                                                    borderRadius: '8px',
                                                    fontSize: '0.85rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.4rem'
                                                }}
                                            >
                                                {group.isMember ? (
                                                    <><UserMinus size={14} /> Rời</>
                                                ) : (
                                                    <><UserPlus size={14} /> Tham gia</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>

            {groups.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <Info size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p>Không có bài viết từ các nhóm, hãy bắt đầu xây dựng cộng đồng nào!</p>
                </div>
            )}
        </div>
    );
};

export default Groups;



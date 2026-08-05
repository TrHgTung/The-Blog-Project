'use client';
import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from '@/next-compat';
import api from '../services/api';
import PostCard from '../components/PostCard';
import { motion } from 'framer-motion';
import { Users, UserPlus, UserMinus, ArrowLeft, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../component-css/GroupDetails.css';
import 'alertifyjs/build/css/alertify.css';
import 'alertifyjs/build/css/themes/default.css';

const GroupDetail = ({ initialGroup, slug }) => {
    const navigate = useNavigate();
    const { user, isAdmin } = useAuth();
    const [group, setGroup] = useState(initialGroup);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(!initialGroup);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [getMembersBirthday, setGetMembersBirthday] = useState(null);
    const [wishPosting, setWishPosting] = useState(false);

    useEffect(() => {
        if (group) {
            document.title = `${group.name} | BlogSocial`;
        }
    }, [group]);

    useEffect(() => {
        fetchGroupDetail();
    }, [slug, page, initialGroup]);

    const fetchGroupDetail = async () => {
        try {
            if (page === 1 && !initialGroup) setLoading(true);
            else setLoadingMore(true);

            const response = await api.get(`/groups/${slug}?page=${page}&limit=10`);

            if (!group) setGroup(response.data.group);

            const newPosts = response.data.posts;
            if (response.data.getMembersBirthday.length > 0) setGetMembersBirthday(response.data.getMembersBirthday);
            setHasMore(newPosts.length === 10);

            if (page === 1) {
                setPosts(newPosts);
            } else {
                setPosts(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));
                    return [...prev, ...uniqueNewPosts];
                });
            }
        } catch (err) {
            setError('Failed to load group details');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleBirthdayWish = async () => {
        if (!getMembersBirthday || wishPosting) return;
        const names = getMembersBirthday.map(m => m.displayName).join(', ');
        const title = `Chúc mừng sinh nhật ${names}!`;
        const content = `Nhân dịp sinh nhật hôm nay, mình xin gửi lời chúc mừng sinh nhật thật nồng nhiệt đến **${names}**! \n\nChúc bạn luôn vui vẻ và gặp nhiều điều may mắn trong năm mới. Hi vọng bạn sẽ có một ngày thật ý nghĩa và tràn đầy niềm vui!`;

        try {
            setWishPosting(true);
            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', content);
            formData.append('groupId', group.id);

            const newPost = await api.post('/posts', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Prepend new post to top of feed
            setPosts(prev => [newPost.data, ...prev]);
            const alertify = (await import('alertifyjs')).default;
            alertify.success(`Đã đăng lời chúc mừng sinh nhật cho ${names}!`);
        } catch (err) {
            const alertify = (await import('alertifyjs')).default;
            alertify.error(err?.response?.data || 'Không thể đăng bài. Vui lòng thử lại!');
        } finally {
            setWishPosting(false);
        }
    };

    const handleJoinLeave = async () => {
        try {
            if (group.isMember) {
                await api.post(`/groups/${group.id}/leave`);
            } else {
                await api.post(`/groups/${group.id}/join`);
            }
            fetchGroupDetail(); // Refresh data
        } catch (err) {
            const alertify = (await import('alertifyjs')).default;
            alertify.error('Thao tác thất bại, vui lòng thử lại!');
        }
    };

    const handleDeleteGroup = async () => {
        if (window.confirm('Nguy hiểm! Bạn có chắc chắn muốn xóa cộng đồng này không? Mọi bài viết bên trong cũng sẽ bị mất!')) {
            try {
                await api.delete(`/groups/${group.id}`);
                const alertify = (await import('alertifyjs')).default;
                alertify.success('Xóa cộng đồng thành công');
                navigate('/groups');
            } catch (err) {
                const alertify = (await import('alertifyjs')).default;
                alertify.error('Xóa cộng đồng thất bại');
            }
        }
    };

    if (loading) return <div className="container maybe-is-birthday-card">Đang tải dữ liệu...</div>;
    if (error) return <div className="container maybe-is-birthday-card"><div className="error-msg">{error}</div></div>;
    if (!group) return <div className="container maybe-is-birthday-card">Có lỗi xảy ra</div>;

    return (
        <div className="container">
            <Link to="/groups" className="nav-link back--link-btn" style={{ marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                <ArrowLeft size={16} /> Quay lại
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="auth-card group-banner-card"
                style={{ maxWidth: 'none', marginBottom: '2.5rem', padding: '2rem' }}
            >
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '20px',
                        background: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Users size={50} color="white" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div className='grp-name-banner-el' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div className='group-name-banner-container'>
                                <h1 className='title-group-name__h1' style={{ margin: 0, fontSize: '2rem' }}>{group.name}</h1>
                                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: '0.6rem', fontSize: '0.9rem', textAlign: 'left' }}>
                                    {group.description}
                                </p>
                            </div>
                            <div className="group-banner-container" style={{ gap: '0.5rem', alignItems: 'center' }}>
                                <button
                                    onClick={handleJoinLeave}
                                    className={`nav-logout-btn ${group.isMember ? 'leave-group-btn' : 'nav-register-btn'}`}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '12px',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {group.isMember ? <><UserMinus size={20} /> Rời</> : <><UserPlus size={20} /> Tham gia</>}
                                </button>
                                {(group.isCreator || isAdmin || user?.isAdmin || group.creatorId === user?.id) && (
                                    <button
                                        onClick={handleDeleteGroup}
                                        className="nav-logout-btn leave-group-btn"
                                        style={{
                                            padding: '0.75rem 1.25rem',
                                            borderRadius: '12px',
                                            background: '#e74c3c',
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            whiteSpace: 'nowrap'
                                        }}
                                        title="Xóa cộng đồng"
                                    >
                                        <Trash2 size={20} />
                                        <span className="display-name-desk" style={{ color: 'white', maxWidth: 'none' }}>Giải tán</span>
                                    </button>
                                )}
                            </div>
                        </div>
                        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '2rem' }}>
                            <div><strong>{group.memberCount}</strong> <span style={{ color: 'var(--text-muted)' }}>Thành viên</span></div>
                            <div><strong>{posts.length}</strong> <span style={{ color: 'var(--text-muted)' }}>Bài viết</span></div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {getMembersBirthday && getMembersBirthday.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        marginBottom: '1.5rem',
                        padding: '1rem 1.5rem',
                        background: 'linear-gradient(135deg, rgba(255,200,50,0.08), rgba(255,100,150,0.08))',
                        borderRadius: '1rem',
                        border: '1px solid rgba(255,200,50,0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        flexWrap: 'wrap'
                    }}
                >
                    <p style={{ margin: 0, color: 'var(--text-muted)', flex: 1 }}>
                        Hôm nay là sinh nhật của:{' '}
                        <strong style={{ color: 'var(--text)' }}>
                            {getMembersBirthday.map(m => m.displayName).join(', ')}
                        </strong>
                    </p>
                    {group.isMember && (
                        <button
                            onClick={handleBirthdayWish}
                            disabled={wishPosting}
                            style={{
                                padding: '0.5rem 1.2rem',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #f6a623, #e91e8c)',
                                color: 'white',
                                border: 'none',
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                cursor: wishPosting ? 'not-allowed' : 'pointer',
                                opacity: wishPosting ? 0.7 : 1,
                                whiteSpace: 'nowrap',
                                transition: 'opacity 0.2s'
                            }}
                        >
                            {wishPosting ? 'Đang đăng trong nhóm...' : 'Gửi nhanh lời chúc'}
                        </button>
                    )}
                </motion.div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 className='h2-group-name' style={{ margin: 0 }}>Điểm tin của {group.name}</h2>
                {group.isMember && (
                    <Link
                        to={`/create-post?group=${group.id}`}
                        className="auth-btn no-margin"
                        style={{ padding: '0.6rem 0.9rem', width: 'auto', textDecoration: 'none', fontSize: '0.8rem' }}
                    >
                        Đăng bài
                    </Link>
                )}
            </div>

            <div className="posts-feed">
                {posts.map(post => (
                    <PostCard key={post.id} post={post} onDelete={(id) => setPosts(posts.filter(p => p.id !== id))} />
                ))}

                {posts.length > 0 && hasMore && (
                    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                        <button
                            className="nav-register-btn"
                            onClick={() => setPage(prev => prev + 1)}
                            disabled={loadingMore}
                            style={{
                                padding: '0.8rem 2rem',
                                opacity: loadingMore ? 0.7 : 1,
                                cursor: loadingMore ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loadingMore ? 'Đang tải...' : 'Tải thêm bài viết'}
                        </button>
                    </div>
                )}
            </div>

            {posts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--card-dark)', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                    <p style={{ color: 'var(--text-muted)' }}>Cộng đồng này chưa có gì cả, hãy mang món quà dầu tiên cho mọi người nào!</p>
                    {group.isMember && (
                        <Link to={`/create-post?group=${group.id}`} className="auth-btn" style={{ textDecoration: 'none', display: 'inline-block', width: 'auto', padding: '0.75rem 2rem', marginTop: '1rem' }}>
                            Đăng bài
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
};

export default GroupDetail;



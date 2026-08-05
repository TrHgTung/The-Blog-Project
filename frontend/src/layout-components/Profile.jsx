'use client';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@/next-compat';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import { UserPlus, UserMinus, MessageCircle, Edit2, Edit, Save, X, LogOut, ShieldOff, MoreVertical, Activity } from 'lucide-react';
import { color, motion } from 'framer-motion';
import { containsBadWords } from '../utils/profanityFilter';

const ProfileSkeleton = () => (
    <div className="container">
        <style>
            {`
                @keyframes skeleton-loading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                .skeleton-box {
                    background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%);
                    background-size: 200% 100%;
                    animation: skeleton-loading 1.5s infinite linear;
                }
            `}
        </style>
        <div className="auth-card" style={{ maxWidth: 'none', marginBottom: '2rem', padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                <div className="skeleton-box" style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}></div>
                <div style={{ flex: 1 }}>
                    <div className="skeleton-box" style={{ width: '40%', height: '32px', marginBottom: '1rem', borderRadius: '8px' }}></div>
                    <div className="skeleton-box" style={{ width: '20%', height: '16px', marginBottom: '1.5rem', borderRadius: '4px' }}></div>
                    <div style={{ display: 'flex', gap: '2rem' }}>
                        <div className="skeleton-box" style={{ width: '80px', height: '24px', borderRadius: '4px' }}></div>
                        <div className="skeleton-box" style={{ width: '80px', height: '24px', borderRadius: '4px' }}></div>
                        <div className="skeleton-box" style={{ width: '80px', height: '24px', borderRadius: '4px' }}></div>
                    </div>
                </div>
            </div>
        </div>
        <div className="skeleton-box" style={{ width: '250px', height: '24px', marginBottom: '1.5rem', borderRadius: '6px' }}></div>
        <div className="posts-feed">
            {[1, 2].map(i => (
                <div key={i} className="post-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: 'var(--card-dark)', borderRadius: '1.5rem', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div className="skeleton-box" style={{ width: '48px', height: '48px', borderRadius: '50%' }}></div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                            <div className="skeleton-box" style={{ width: '40%', height: '14px', borderRadius: '4px' }}></div>
                            <div className="skeleton-box" style={{ width: '25%', height: '10px', borderRadius: '4px' }}></div>
                        </div>
                    </div>
                    <div className="skeleton-box" style={{ width: '90%', height: '24px', marginBottom: '1rem', borderRadius: '6px' }}></div>
                    <div className="skeleton-box" style={{ width: '100%', height: '200px', borderRadius: '12px' }}></div>
                </div>
            ))}
        </div>
    </div>
);

const Profile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser, updateUserLocal, logout, isAdmin, loading: authLoading } = useAuth();
    const [profileUser, setProfileUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(true);

    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        displayName: '',
        bio: '',
        cartoonCharacter: ''
    });
    const [loggingOutOthers, setLoggingOutOthers] = useState(false);
    const [showActions, setShowActions] = useState(false);

    const isOwnProfile = currentUser?.id && id && String(currentUser.id).toLowerCase() === String(id).toLowerCase();
    const displayUser = isOwnProfile ? { ...profileUser, ...currentUser } : profileUser;

    useEffect(() => {
        if (displayUser?.displayName) {
            document.title = `Trang cá nhân của ${displayUser.displayName} | BlogSocial`;
        }
    }, [displayUser]);

    useEffect(() => {
        const fetchProfileData = async () => {
            setLoading(true);
            try {
                // Fetch user info directly
                const userRes = await api.get(`/users/${id}`);
                setProfileUser(userRes.data);
                setEditData({
                    displayName: userRes.data.displayName,
                    bio: userRes.data.bio || '',
                    cartoonCharacter: userRes.data.cartoonCharacter || '1'
                });

                const postsRes = await api.get('/posts');
                const userPosts = postsRes.data.filter(p => p.authorId === id);
                setPosts(userPosts);

                const followersRes = await api.get(`/follows/followers/${id}`);
                const followingRes = await api.get(`/follows/following/${id}`);

                // Handle both old (array) and new (object with data property) backend formats
                const followersData = followersRes.data?.data || (Array.isArray(followersRes.data) ? followersRes.data : []);
                const followingData = followingRes.data?.data || (Array.isArray(followingRes.data) ? followingRes.data : []);

                setFollowers(followersData);
                setFollowing(followingData);

                // Fetch current user's following list for better verification if viewing someone else
                let currentUserFollowing = [];
                if (currentUser && !isOwnProfile) {
                    try {
                        const myFollowingRes = await api.get(`/follows/following/${currentUser.id}`);
                        currentUserFollowing = myFollowingRes.data?.data || (Array.isArray(myFollowingRes.data) ? myFollowingRes.data : []);
                    } catch (e) {
                        console.error("Failed to fetch my following list", e);
                    }
                }

                if (currentUser && !isOwnProfile) {
                    const isInFollowers = followersData.some(f => {
                        const fid = f?.id || f?.followerId || f?.userId || (typeof f === 'string' ? f : null);
                        return fid && String(fid).toLowerCase() === String(currentUser.id).toLowerCase();
                    });
                    
                    const isInMyFollowing = currentUserFollowing.some(f => {
                        const fid = f?.id || f?.followingId || f?.followedId || f?.userId || (typeof f === 'string' ? f : null);
                        return fid && String(fid).toLowerCase() === String(id).toLowerCase();
                    });

                    setIsFollowing(isInFollowers || isInMyFollowing);
                }
            } catch (err) {
                console.error('Failed to load profile', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [id, currentUser]);

    const handleFollow = async () => {
        try {
            if (isFollowing) {
                await api.delete(`/follows/${id}`);
                setFollowers(prev => prev.filter(f => String(f.id) !== String(currentUser.id)));
            } else {
                await api.post(`/follows/${id}`);
                setFollowers(prev => [...prev, { id: currentUser.id, displayName: currentUser.displayName }]);
            }
            setIsFollowing(!isFollowing);
        } catch (err) {
            alert('Operation failed');
        }
    };

    const handleSaveProfile = async () => {
        if (!isAdmin && containsBadWords(editData.displayName)) {
            alert('Tên hiển thị chứa từ ngữ không hợp lệ.');
            return;
        }
        if (!isAdmin && containsBadWords(editData.bio)) {
            alert('Tiểu sử chứa từ ngữ không hợp lệ.');
            return;
        }
        try {
            const res = await api.put('/users/profile', editData);
            updateUserLocal(res.data);
            setProfileUser({ ...profileUser, ...res.data });
            setIsEditing(false);
            alert('Profile updated successfully!');
        } catch (err) {
            alert('Failed to update profile');
        }
    };

    const handleLogoutOtherDevices = async () => {
        if (!window.confirm('Bạn có chắc chắn muốn đăng xuất khỏi tất cả các thiết bị khác không?')) return;

        try {
            setLoggingOutOthers(true);
            const res = await api.post('/auth/logout-other-devices');

            // If the server returned a new token for the current session
            if (res.data.newToken) {
                updateUserLocal({ token: res.data.newToken });
            }

            alert(res.data.message || 'Đã đăng xuất thành công khỏi các thiết bị khác.');
        } catch (err) {
            alert('Không thể thực hiện đăng xuất từ xa.');
        } finally {
            setLoggingOutOthers(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading || authLoading) return <ProfileSkeleton />;
    if (!profileUser) return (
        <div className="container">
            <div className="auth-card" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '4rem 2rem' }}>
                <ShieldOff size={64} style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', opacity: 0.5 }} />
                <h2 style={{ marginBottom: '1rem' }}>Không tìm thấy người dùng</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                    Hồ sơ bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
                </p>
                <button
                    onClick={() => navigate('/home')}
                    className="auth-btn"
                    style={{ width: 'auto', padding: '0.8rem 2rem', margin: '0 auto' }}
                >
                    Quay lại Trang chủ
                </button>
            </div>
        </div>
    );

    const lastName = displayUser.displayName.split(' ').pop();

    return (
        <div className="container">
            <motion.div
                className="auth-card"
                style={{ maxWidth: 'none', marginBottom: '2rem' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="profile-header" style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }}>
                        <img
                            src={displayUser.profilePicture || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/cartoon/${displayUser.cartoonCharacter}.png`}
                            alt={displayUser.displayName}
                            style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px solid var(--primary)', background: 'var(--bg-dark)' }}
                        />
                    </div>

                    <div style={{ flex: 1 }}>
                        {isEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label">Tên hiển thị mới</label>
                                    <input
                                        className="form-input"
                                        value={editData.displayName}
                                        onChange={e => setEditData({ ...editData, displayName: e.target.value })}
                                        maxLength={50}
                                    />
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label">Điều chỉnh phần Giới thiệu</label>
                                    <textarea
                                        className="form-input"
                                        value={editData.bio}
                                        onChange={e => setEditData({ ...editData, bio: e.target.value })}
                                        placeholder="Hãy giới thiệu về bản thân bạn..."
                                        maxLength={200}
                                    />
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label">ID cartoon yêu thích (1-151)</label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        min="1"
                                        max="1025"
                                        value={editData.cartoonCharacter}
                                        onChange={e => setEditData({ ...editData, cartoonCharacter: e.target.value })}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button onClick={handleSaveProfile} className="auth-btn save-edit-btn" style={{ width: 'auto', padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Save size={18} /> Lưu
                                    </button>
                                    <button onClick={() => setIsEditing(false)} className="nav-logout-btn cancel-edit-btn">
                                        <X size={18} /> Hủy
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div className='display-name-desk-prof-container'>
                                        <h1 className="display-name-desk-profile" style={{ margin: 0 }}>{displayUser.displayName}</h1>
                                        <p className='display-name-desk-username-prof' style={{ color: 'var(--text-muted)', textAlign: 'left', margin: '4px 0 0 0' }}>@{displayUser.username}</p>
                                    </div>
                                    {isOwnProfile && (
                                        <div style={{ position: 'relative' }}>
                                            <button
                                                onClick={() => setShowActions(!showActions)}
                                                className="nav-register-btn"
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    background: 'white',
                                                    border: '1px solid var(--border)',
                                                    padding: 0
                                                }}
                                                title="Tùy chọn"
                                            >
                                                <MoreVertical size={20} />
                                            </button>

                                            {showActions && (
                                                <>
                                                    <div
                                                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}
                                                        onClick={() => setShowActions(false)}
                                                    />
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '100%',
                                                        right: 0,
                                                        marginTop: '0.5rem',
                                                        background: 'var(--card-dark)',
                                                        border: '1px solid var(--border)',
                                                        borderRadius: '12px',
                                                        padding: '0.5rem',
                                                        width: '240px',
                                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                                                        zIndex: 11,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '0.25rem'
                                                    }}>
                                                        <button
                                                            onClick={() => {
                                                                setIsEditing(true);
                                                                setShowActions(false);
                                                            }}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.5rem',
                                                                padding: '0.75rem 1rem',
                                                                borderRadius: '8px',
                                                                border: 'none',
                                                                background: 'transparent',
                                                                color: 'var(--text)',
                                                                cursor: 'pointer',
                                                                textAlign: 'left',
                                                                fontSize: '0.8rem',
                                                                width: '100%',
                                                                transition: 'background 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
                                                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                                        >
                                                            <Edit size={12} color="var(--primary)" />
                                                            Chỉnh sửa trang cá nhân
                                                        </button>

                                                        <button
                                                            onClick={() => {
                                                                handleLogoutOtherDevices();
                                                                setShowActions(false);
                                                            }}
                                                            disabled={loggingOutOthers}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.5rem',
                                                                padding: '0.75rem 1rem',
                                                                borderRadius: '8px',
                                                                border: 'none',
                                                                background: 'transparent',
                                                                color: 'var(--text)',
                                                                cursor: 'pointer',
                                                                textAlign: 'left',
                                                                fontSize: '0.8rem',
                                                                width: '100%',
                                                                opacity: loggingOutOthers ? 0.5 : 1,
                                                                transition: 'background 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
                                                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                                        >
                                                            <ShieldOff size={16} color="var(--primary)" />
                                                            Đăng xuất khẩn cấp trên các thiết bị khác
                                                        </button>

                                                        {isAdmin && (
                                                            <button
                                                                onClick={() => {
                                                                    navigate('/admin/health');
                                                                    setShowActions(false);
                                                                }}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.5rem',
                                                                    padding: '0.75rem 1rem',
                                                                    borderRadius: '8px',
                                                                    border: 'none',
                                                                    background: 'transparent',
                                                                    color: 'var(--text)',
                                                                    cursor: 'pointer',
                                                                    textAlign: 'left',
                                                                    fontSize: '0.8rem',
                                                                    width: '100%',
                                                                    transition: 'background 0.2s'
                                                                }}
                                                                onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
                                                                onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                                            >
                                                                <Activity size={16} color="#34d399" />
                                                                Xem Tình trạng Hệ thống
                                                            </button>
                                                        )}

                                                        <div style={{ height: '1px', background: 'var(--border)', margin: '0.25rem 0' }} />

                                                        <button
                                                            onClick={() => {
                                                                handleLogout();
                                                                setShowActions(false);
                                                            }}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.75rem',
                                                                padding: '0.75rem 1rem',
                                                                borderRadius: '8px',
                                                                border: 'none',
                                                                background: 'transparent',
                                                                color: 'var(--danger)',
                                                                cursor: 'pointer',
                                                                textAlign: 'left',
                                                                fontSize: '0.9rem',
                                                                width: '100%',
                                                                transition: 'background 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => e.target.style.background = 'rgba(220, 38, 38, 0.05)'}
                                                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                                        >
                                                            <LogOut size={18} />
                                                            Đăng xuất
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {displayUser.bio && (
                                    <p style={{ marginTop: '1rem', lineHeight: '1.6', textAlign: 'left' }}>{displayUser.bio}</p>
                                )}

                                <div className='user-follower-count-cont' style={{ display: 'flex', marginTop: '1.5rem' }}>
                                    <div><strong>{posts.length}</strong> <span className='fl-label-txt' style={{ color: 'var(--text-muted)' }}>Bài viết</span></div>
                                    <div><strong>{followers.length}</strong> <span className='fl-label-txt' style={{ color: 'var(--text-muted)' }}>Người theo dõi</span></div>
                                    <div><strong>{following.length}</strong> <span className='fl-label-txt' style={{ color: 'var(--text-muted)' }}>Đang theo dõi</span></div>
                                </div>

                                {!isOwnProfile && currentUser && (
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                        <button
                                            onClick={handleFollow}
                                            className="auth-btn"
                                            style={{ width: 'auto', padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0' }}
                                        >
                                            {isFollowing ? <><UserMinus size={18} /> Hủy theo dõi</> : <><UserPlus size={18} /> Theo dõi</>}
                                        </button>
                                        <button
                                            onClick={() => navigate(`/chat?userId=${id}`)}
                                            className="nav-register-btn profile-reg-btn"
                                            disabled={!isFollowing}
                                            style={{
                                                opacity: isFollowing ? 1 : 0.5,
                                                cursor: isFollowing ? 'pointer' : 'not-allowed',
                                                background: 'var(--card-dark)',
                                                border: '1px solid var(--border)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}
                                            title={isFollowing ? '' : 'Follow để bắt đầu chat'}
                                        >
                                            <MessageCircle size={18} /> Chat
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </motion.div>

            <h2 className='profile-page__limit-char-spec-mobile'>{lastName} đã đăng:</h2>
            <div className="posts-feed">
                {posts.map(post => (
                    <PostCard key={post.id} post={post} onDelete={(id) => setPosts(posts.filter(p => p.id !== id))} />
                ))}
            </div>
        </div>
    );
};

export default Profile;



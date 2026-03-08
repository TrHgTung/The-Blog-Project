import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, ThumbsUp, ThumbsDown, User, ArrowLeft, Plus, MessageCircle, UserPlus } from 'lucide-react';

const TopicDetailPage = () => {
    const { topicId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [topic, setTopic] = useState(null);
    const [postAuthor, setPostAuthor] = useState([]);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isJoined, setIsJoined] = useState(false);

    const [test, setTest] = useState([]);

    useEffect(() => {
        const fetchTopicData = async () => {
            try {
                const [topicRes, postsRes, joinedIdsRes] = await Promise.all([
                    api.get(`/api/user-service/Topic/topic-details/${topicId}`),
                    api.get(`/api/user-service/PostTopic/all-posts/${topicId}`),
                    user ? api.get('/api/user-service/Topic/my-joined-topic-ids') : null
                ]);

                setTopic(topicRes.data);
                setPostAuthor(postsRes.data.postAuthor);
                // API returns { Posts: [], UpvotesAndDownvotes: [] }
                setPosts(postsRes.data.posts || postsRes.data.Posts || []);
                setTest(postsRes.data);

                if (joinedIdsRes) {
                    setIsJoined(joinedIdsRes.data.includes(topicId));
                }
            } catch (err) {
                console.error('Error fetching topic detail:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTopicData();
    }, [topicId, user]);

    const handleJoinToggle = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            if (isJoined) {
                await api.patch(`/api/user-service/Topic/leave-topic/${topicId}`);
                setIsJoined(false);
            } else {
                await api.post(`/api/user-service/Topic/join-to-topic/${topicId}`);
                setIsJoined(true);
            }
        } catch (err) {
            console.error('Failed to toggle join status:', err);
        }
    };

    if (loading) return <div className="loading">Đang tải chi tiết nhóm...</div>;
    if (!topic) return <div className="error-msg">Không tìm thấy thông tin nhóm.</div>;

    return (
        <div className="topic-detail-page">
            <button className="back-btn" onClick={() => navigate('/groups')}>
                <ArrowLeft size={18} /> Quay lại
            </button>

            <div className="topic-header glass-card" style={{
                borderLeft: `8px solid ${topic.topicBackgroundColor || 'var(--primary)'}`
            }}>
                <div className="topic-info">
                    <h1 className="topic-name">{topic.topicName}</h1>
                    <p className="topic-desc">{topic.topicDescription}</p>
                </div>
                <div className="topic-actions">
                    <button
                        className={`btn ${isJoined ? 'btn-secondary' : ''}`}
                        onClick={handleJoinToggle}
                    >
                        {isJoined ? 'Đã tham gia' : 'Tham gia nhóm'}
                    </button>
                    {isJoined && (
                        <button className="btn btn-primary" onClick={() => navigate('/create-post')}>
                            <Plus size={18} /> Đăng bài mới
                        </button>
                    )}
                </div>
            </div>

            <h2 className="section-title">Bài viết trong nhóm, {test.toString()}</h2>
            <div className="posts-grid">
                {posts.length > 0 ? posts.map(post => (
                    <div key={post.id} className="post-card glass-card">
                        <div className="post-author-header">
                            <Link to={`/user/${post.userId}`} className="author-info">
                                <img
                                    src={post.authorAvatar || `https://ui-avatars.com/api/?name=${post.authorName}&background=random`}
                                    alt={post.authorName}
                                    className="author-avatar-small"
                                />
                                <span className="author-name">{post.authorName || 'Anonymous'}</span>
                            </Link>
                            {user && user.id !== post.userId && (
                                <div className="post-actions-quick">
                                    <button
                                        className="icon-btn"
                                        onClick={() => navigate(`/user/${post.userId}`)}
                                        title="Follow/View Profile"
                                    >
                                        <UserPlus size={16} />
                                    </button>
                                    <button
                                        className="icon-btn"
                                        onClick={() => navigate('/chat', { state: { startWithUser: { id: post.userId, username: post.authorName, avatarImage: post.authorAvatar } } })}
                                        title="Chat"
                                    >
                                        <MessageCircle size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                        <h3 className="post-title">{post.postTitle}</h3>
                        <p className="post-excerpt">{post.postContent.substring(0, 150)}...</p>
                        <div className="post-meta">
                            <div className="meta-actions">
                                <span className="action-item"><ThumbsUp size={14} /> {post.upvotes || post.Upvotes || 0}</span>
                                <span className="action-item"><ThumbsDown size={14} /> {post.downvotes || post.Downvotes || 0}</span>
                                <span className="action-item"><MessageSquare size={14} /> {post.comments || 0}</span>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="no-posts glass-card">
                        <p>Chưa có bài viết nào trong nhóm này. Hãy là người đầu tiên chia sẻ!</p>
                    </div>
                )}
            </div>

            <style>{`
                .back-btn {
                    background: none;
                    border: none;
                    color: var(--text-muted);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    margin-bottom: 1rem;
                    transition: color 0.2s;
                }
                .back-btn:hover {
                    color: var(--text-main);
                }
                .topic-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 2rem;
                    margin-bottom: 3rem;
                    gap: 2rem;
                    flex-wrap: wrap;
                }
                .topic-info {
                    flex: 1;
                    min-width: 300px;
                }
                .topic-name {
                    margin: 0 0 1rem 0;
                    color: var(--text-main);
                }
                .topic-desc {
                    color: var(--text-muted);
                    font-size: 1.1rem;
                }
                .topic-actions {
                    display: flex;
                    gap: 1rem;
                }
                .section-title {
                    margin-bottom: 2rem;
                    font-size: 1.5rem;
                    color: var(--text-main);
                }
                .btn-secondary {
                    background: rgba(16, 185, 129, 0.2);
                    color: #10b981;
                    border: 1px solid rgba(16, 185, 129, 0.3);
                }
            `}</style>
        </div>
    );
};

export default TopicDetailPage;

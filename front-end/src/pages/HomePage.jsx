import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { MessageSquare, ThumbsUp, ThumbsDown, User, MessageCircle, UserPlus, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../style/HomePage.css';

const HomePage = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [nfMessage, setNfMessage] = useState("");

    const { user } = useAuth() || {};
    const navigate = useNavigate();
    const mockPosts = [
        {
            id: 1,
            userId: 1,
            postSlug: "welcome-mock",
            postTitle: "Chào mừng đến với The Blog Social",
            postContent: "Bạn chưa đăng nhập, hãy đăng nhập để khám phá thêm nhé",
            authorName: "The Blog Social",
            authorAvatar: "",
            upvote: 5,
            downvote: 1,
            comments: []
        }
    ];

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                let response;
                if (user) {
                    response = await api.get('/api/user-service/PostTopic/post-newsfeed');
                    const postsData = response.data.posts || [];
                    // const moreInfo = response.data.moreInfo || [];

                    const mergedPosts = postsData.map(post => {
                        // const info = moreInfo.find(m => m.postId === post.id);
                        return {
                            ...post,
                            postContent: post?.postContent.replace(/<[^>]+>/g, "").substring(0, 250) || 'Đây chính là nội dung của bài viết',
                            authorName: post?.authorName || 'Anonymous',
                            authorAvatar: post?.authorAvatar || '',
                            upvote: post?.upvotes || 0,
                            downvote: post?.downvotes || 0
                        };
                    });

                    if (mergedPosts.length === 0) {
                        setNfMessage("Chưa có bài viết nào trong các nhóm bạn đã tham gia. Hãy tham gia thêm nhóm để cập nhật bài viết mới!");
                    }
                    setPosts(mergedPosts);
                } else {
                    // dạng post giả
                    setPosts(mockPosts);
                }
            } catch (error) {
                console.error('Failed to fetch posts:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, [user]);

    if (loading) return <div className="loading">Loading feed...</div>;

    return (
        <div className="home-page">
            <header className="page-header">
                <h1>Chào mừng đến với The Blog Social</h1>
                <p>Khám phá những câu chuyện mới nhất từ các cộng đồng của bạn</p>
            </header>

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
                                        title="Xem Profile"
                                    >
                                        <User size={16} />
                                    </button>

                                </div>
                            )}
                        </div>
                        <Link to={`/post/${post.postSlug}`} style={{ textDecoration: 'none' }}>
                            <h3 className="post-title">{post.postTitle}</h3>
                        </Link>
                        <p className="post-excerpt">{post.postContent}...</p>
                        <div className="post-meta">
                            <span className="meta-item"><User size={14} /> {post.authorName || 'Anonymous'}</span>
                            <div className="meta-actions">
                                <span className="action-item"><ThumbsUp size={14} /> {post.upvote || 0}</span>
                                <span className="action-item"><ThumbsDown size={14} /> {post.downvote || 0}</span>
                                <span className="action-item"><MessageSquare size={14} /> {post.comments?.length || 0}</span>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="no-posts glass-card">
                        <p>{nfMessage}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomePage;

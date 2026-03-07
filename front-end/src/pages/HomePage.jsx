import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { MessageSquare, ThumbsUp, ThumbsDown, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [nfMessage, setNfMessage] = useState("");

    const { user } = useAuth() || {};

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                let response;
                if (user) {
                    response = await api.get('/api/user-service/PostTopic/post-newsfeed');
                    // If no posts in joined topics, get global feed
                    if (!response.data.posts || response.data.posts.length === 0) {
                        setNfMessage("Chưa có bài viết nào trong các nhóm bạn đã tham gia. Hãy tham gia thêm nhóm để cập nhật bài viết mới!");
                    }
                    setPosts(response.data.posts || []); // lay data post len newsfeed
                } else {
                    setNfMessage("Bạn chưa đăng nhập, hãy đăng nhập để khám phá thêm nhé");
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
                <h1>Chào mừng đến với The Blog</h1>
                <p>Khám phá những câu chuyện mới nhất từ các cộng đồng của bạn</p>
            </header>

            <div className="posts-grid">
                {posts.length > 0 ? posts.map(post => (
                    <div key={post.id} className="post-card glass-card">
                        <h3 className="post-title">{post.postTitle}</h3>
                        <p className="post-excerpt">{post.postContent.substring(0, 150)}...</p>
                        <div className="post-meta">
                            <span className="meta-item"><User size={14} /> {post.userId || 'Anonymous'}</span>
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

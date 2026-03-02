import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { MessageSquare, ThumbsUp, ThumbsDown, User } from 'lucide-react';

const HomePage = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                // Topic ID 0000... is just a placeholder
                const response = await api.get('/api/user-service/PostTopic/all-posts/00000000-0000-0000-0000-000000000000');
                // The API returns { Posts: [], UpvotesAndDownvotes: [] }
                setPosts(response.data.posts || response.data.Posts || []);
            } catch (error) {
                console.error('Failed to fetch posts:', error.response?.status === 401 ? 'Unauthorized - Please login' : error);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    if (loading) return <div className="loading">Loading feed...</div>;

    return (
        <div className="home-page">
            <header className="page-header">
                <h1>Bản tin thế giới</h1>
                <p>Khám phá những câu chuyện mới nhất từ cộng đồng.</p>
            </header>

            <div className="posts-grid">
                {posts.length > 0 ? posts.map(post => (
                    <div key={post.id} className="post-card glass-card">
                        <h3 className="post-title">{post.postTitle}</h3>
                        <p className="post-excerpt">{post.postContent.substring(0, 150)}...</p>
                        <div className="post-meta">
                            <span className="meta-item"><User size={14} /> {post.username || 'Anonymous'}</span>
                            <div className="meta-actions">
                                <span className="action-item"><ThumbsUp size={14} /> {post.upvote || 0}</span>
                                <span className="action-item"><ThumbsDown size={14} /> {post.downvote || 0}</span>
                                <span className="action-item"><MessageSquare size={14} /> {post.comments?.length || 0}</span>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="no-posts glass-card">
                        <p>Chưa có bài viết nào. Hãy là người đầu tiên chia sẻ!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomePage;

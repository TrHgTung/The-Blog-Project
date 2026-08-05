'use client';
import { useState, useEffect, useMemo } from 'react';
import { Link } from '@/next-compat';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import PostCard from '../components/PostCard';
import { motion } from 'framer-motion';
import SpecialCard from '../components/SpecialCard';
import BirthdayCard from '../components/BirthdayCard';
import CreatePostArea from '../components/CreatePostArea';

const PostSkeleton = () => (
    <div className="post-card" style={{
        padding: '1.5rem',
        marginBottom: '1.5rem',
        background: 'var(--card-dark)',
        borderRadius: '1.5rem',
        border: '1px solid var(--border)',
        overflow: 'hidden'
    }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="skeleton-box" style={{ width: '48px', height: '48px', borderRadius: '50%' }}></div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                <div className="skeleton-box" style={{ width: '40%', height: '14px', borderRadius: '4px' }}></div>
                <div className="skeleton-box" style={{ width: '25%', height: '10px', borderRadius: '4px' }}></div>
            </div>
        </div>
        <div className="skeleton-box" style={{ width: '90%', height: '24px', marginBottom: '1rem', borderRadius: '6px' }}></div>
        <div className="skeleton-box" style={{ width: '100%', height: '160px', marginBottom: '1rem', borderRadius: '12px' }}></div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div className="skeleton-box" style={{ width: '60px', height: '24px', borderRadius: '4px' }}></div>
            <div className="skeleton-box" style={{ width: '60px', height: '24px', borderRadius: '4px' }}></div>
        </div>
    </div>
);

const Home = ({ initialPosts }) => {
    useEffect(() => {
        document.title = 'Dòng thời gian của mọi người | Bảng tin BlogSocial';
    }, []);
    const { user } = useAuth();
    const [posts, setPosts] = useState(initialPosts || []);
    const [loading, setLoading] = useState(false);
    const [specialIndex, setSpecialIndex] = useState(() => {
        if (initialPosts?.length > 0) {
            return Math.floor(Math.random() * Math.min(initialPosts.length, 5)) + 1;
        }
        return -1;
    });
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(initialPosts?.length === 10);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        const checkIsGuide = localStorage.getItem('hasSeenTour');
        if (!checkIsGuide || checkIsGuide == false) {
            localStorage.setItem('hasSeenTour', true);
        }

        // Skip first fetch if we have initialPosts and are on page 1
        if (page === 1 && initialPosts) return;

        const fetchPosts = async () => {
            try {
                if (posts.length === 0) setLoading(true);
                setLoadingMore(true);
                const response = await api.get(`/posts?page=${page}&limit=10`);
                const data = response.data;

                setHasMore(data.length === 10);

                setPosts(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const newPosts = data.filter(p => !existingIds.has(p.id));
                    return [...prev, ...newPosts];
                });
            } catch (err) {
                console.error('Failed to fetch posts', err);
            } finally {
                setLoadingMore(false);
                setLoading(false);
            }
        };
        fetchPosts();
    }, [page, initialPosts]);

    const handleDeletePost = (postId) => {
        setPosts(posts.filter(p => p.id !== postId));
    };

    return (
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

            <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ marginBottom: '2rem' }}
            >
                {user ? 'Bảng tin của bạn' : 'Bài viết gần đây'}
            </motion.h1>

            {user && <BirthdayCard />}
            {user && <CreatePostArea id="home-create-post-area" />}

            {loading ? (
                <div className="posts-feed">
                    {[1, 2, 3].map(i => <PostSkeleton key={i} />)}
                </div>
            ) : posts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--card-dark)', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        {user
                            ? "Hãy khám phá mọi thứ xung quanh nhé, những con người thú vị sẽ khiến cho bạn vui vẻ hơn đó!"
                            : "Không có bài viết từ các nhóm, hãy bắt đầu xây dựng cộng đồng nào"}
                    </p>
                    {user && (
                        <Link to="/groups" className="nav-register-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>
                            Khám phá các Cộng đồng
                        </Link>
                    )}
                </div>
            ) : (
                <div className="posts-feed">
                    {posts.map((post, index) => (
                        <div key={post.id || index}>
                            {/* Inject Special Card at specialIndex position */}
                            {user && index === specialIndex && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <SpecialCard />
                                </div>
                            )}

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <PostCard post={post} onDelete={handleDeletePost} />
                            </motion.div>
                        </div>
                    ))}

                    {hasMore && (
                        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                            {loadingMore ? (
                                <div className="posts-feed">
                                    <PostSkeleton />
                                </div>
                            ) : (
                                <button
                                    className="nav-register-btn"
                                    onClick={() => setPage(prev => prev + 1)}
                                    style={{
                                        padding: '0.8rem 2rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Tải thêm bài viết
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Home;



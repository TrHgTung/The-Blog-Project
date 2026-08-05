'use client';
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from '@/next-compat';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileX, Loader2 } from 'lucide-react';
import api from '../services/api';
import PostCard from '../components/PostCard';
import { Link } from '@/next-compat';
// import alertify from 'alertifyjs';
// import 'alertifyjs/build/css/alertify.css';

const SearchResults = () => {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';

    useEffect(() => {
        if (query) {
            document.title = `Tìm kiếm cho từ khóa "${query}" | BlogSocial`;
        } else {
            document.title = 'Tìm kiếm | BlogSocial';
        }
    }, [query]);

    const [filteredPosts, setFilteredPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [matchedcartoon, setMatchedcartoon] = useState(null);
    const PAGE_LIMIT = 50; 

    useEffect(() => {
        const fetchSearchResults = async () => {
            if (!query.trim()) {
                setFilteredPosts([]);
                setMatchedcartoon(null);
                return;
            }

            setLoading(true);
            setErrorMessage(null);
            try {
                const res = await api.get(`/posts/search-results?KeywordInput=${encodeURIComponent(query.trim())}&limit=${PAGE_LIMIT}`);
                const data = res.data;
                if (data.posts) {
                    setFilteredPosts(data.posts);
                    setMatchedcartoon(data.matchedcartoon || null);
                    
                    if (data.matchedcartoon) {
                        try {
                            const savedcartoons = JSON.parse(localStorage.getItem('myCurrentCharacters')) || [];
                            if (!savedcartoons.find(p => p.id === data.matchedcartoon.id)) {
                                savedcartoons.push(data.matchedcartoon);
                                localStorage.setItem('myCurrentCharacters', JSON.stringify(savedcartoons));
                            }
                        } catch (e) {
                            console.error('Lỗi khi lưu dữ liệu:', e);
                        }
                    }
                } else {
                    setFilteredPosts(data);
                    setMatchedcartoon(null);
                }
            } catch (err) {
                console.error('Failed to fetch search results:', err);
                if (err.response?.status === 400 && err.response.data?.errors) {
                    const firstErrorKey = Object.keys(err.response.data.errors)[0];
                    if (firstErrorKey) {
                        setErrorMessage(err.response.data.errors[firstErrorKey][0]);
                        setFilteredPosts([]);
                    }
                } else if (err.response?.status === 400) {
                     setErrorMessage("Yêu cầu tìm kiếm không hợp lệ.");
                     setFilteredPosts([]);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchSearchResults();
    }, [query]);

    const handleDeletePost = (postId) => {
        setFilteredPosts(prev => prev.filter(p => p.id !== postId));
    };

    return (
        <div className="container">

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: '2rem' }}
            >
                <div className='result-title-search-container' style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <Search size={20} color="var(--primary)" className='search-result-icon' />
                    <h1 className='result-title-search' style={{ margin: 0 }}>Kết quả tìm kiếm</h1>
                </div>
                {query && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
                        {loading
                            ? 'Đang tải dữ liệu...'
                            : `Tìm thấy ${filteredPosts.length} bài viết cho`
                        }
                        {!loading && (
                            <span style={{
                                marginLeft: '0.4rem',
                                color: 'var(--text-main)',
                                fontWeight: 600,
                                background: 'rgba(165,167,221,0.15)',
                                padding: '0.1rem 0.5rem',
                                borderRadius: '0.4rem'
                            }}>
                                "{query}"
                            </span>
                        )}
                    </p>
                )}
            </motion.div>

            {/* cartoon Match result */}
            {!loading && matchedcartoon && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        background: 'rgba(48, 48, 48, 0.46)',
                        border: '1px solid #bdbdbdc2',
                        borderRadius: '0.75rem',
                        padding: '0.85rem 1.25rem',
                        marginBottom: '1.5rem',
                        fontSize: '0.95rem',
                        color: 'var(--text-main)',
                    }}
                >
                    <div>
                        <img height='50px' src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/cartoon/${matchedcartoon.id}.png`} className='mini-cartoon-ico' alt={matchedcartoon.name} />
                    </div>
                    <span className='span__easter-eggs-result'>
                        Easter-egg: Bạn đã tìm ra một {' '}
                        <strong style={{ color: 'gold' }}>{matchedcartoon.name} hoang dã</strong>.
                        Xem đầy đủ <Link to="/my-characters" style={{ color: '#f2a88db9', textDecoration: 'none', fontWeight: 700 }}>bộ sưu tập của bạn</Link>
                    </span>
                </motion.div>
            )}

            {/* Loading */}
            {loading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '4rem 2rem',
                        color: 'var(--text-muted)'
                    }}
                >
                    <Loader2 size={36} className="search-spinner" />
                    <span>Đang tải...</span>
                </motion.div>
            )}

            {/* No query */}
            {!loading && !query.trim() && !errorMessage && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="search-empty-state"
                >
                    <Search size={48} opacity={0.3} />
                    <p>Nhập từ khoá vào ô tìm kiếm để bắt đầu</p>
                </motion.div>
            )}

            {/* Validation Error */}
            {!loading && errorMessage && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="search-empty-state"
                >
                    <FileX size={48} color="var(--danger, #ff4d4f)" opacity={0.7} />
                    <p style={{ color: 'var(--danger, #ff4d4f)', marginTop: '1rem' }}><strong>{errorMessage}</strong></p>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Vui lòng nhập lại từ khoá hợp lệ
                    </span>
                </motion.div>
            )}

            {/* No results */}
            {!loading && query.trim() && filteredPosts.length === 0 && !errorMessage && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="search-empty-state"
                >
                    <FileX size={48} opacity={0.3} />
                    <p>Không tìm thấy nội dung nào phù hợp với <span className='result__span-strong'><strong>"{query}"</strong></span></p>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Hãy thử từ khoá khác nha
                    </span>
                </motion.div>
            )}

            {/* Results */}
            {!loading && filteredPosts.length > 0 && (
                <AnimatePresence>
                    <div className="posts-feed">
                        {filteredPosts.map((post, index) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: Math.min(index * 0.05, 0.5) }}
                            >
                                <PostCard post={post} onDelete={handleDeletePost} />
                            </motion.div>
                        ))}
                    </div>
                </AnimatePresence>
            )}
        </div>
    );
};

export default SearchResults;



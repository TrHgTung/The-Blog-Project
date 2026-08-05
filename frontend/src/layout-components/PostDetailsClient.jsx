'use client';
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from '@/next-compat';
import {
    Share2,
    ArrowLeft,
    ThumbsUp,
    ThumbsDown,
    MessageCircle,
    Check,
    Send,
    Trash2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import DOMPurify from 'dompurify';

const safeSanitize = (html) => {
    if (typeof window === 'undefined') return html; // Avoid hydration errors by matching client HTML
    if (DOMPurify && typeof DOMPurify.sanitize === 'function') {
        return DOMPurify.sanitize(html);
    } else if (DOMPurify && DOMPurify.default && typeof DOMPurify.default.sanitize === 'function') {
        return DOMPurify.default.sanitize(html);
    }
    return html;
};

import api from '../services/api';
import { useAuth } from '../context/AuthContext';


const PostDetails = ({ initialPost, initialComments }) => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Post state
    const [post, setPost] = useState(initialPost);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [userVote, setUserVote] = useState(initialPost?.userVote || 0);
    const [upvotes, setUpvotes] = useState(initialPost?.upvotes || 0);
    const [downvotes, setDownvotes] = useState(initialPost?.downvotes || 0);

    // Comment state
    const [comments, setComments] = useState(initialComments || []);
    const [loadingComments, setLoadingComments] = useState(false);
    const [commentContent, setCommentContent] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null); // comment id
    const [replyContent, setReplyContent] = useState('');
    const [commentCount, setCommentCount] = useState(initialComments?.length || 0);

    useEffect(() => {
        if (post) {
            document.title = `${post.title} | BlogSocial`;
        }
    }, [post]);

    useEffect(() => {
        window.scrollTo(0, 0);

        // If slug changes and we don't have the post yet (client-side navigation)
        if (slug && (!post || post.slug !== slug)) {
            const fetchPost = async () => {
                try {
                    setLoading(true);
                    const response = await api.get(`/posts/slug/${slug}`);
                    const postData = response.data;
                    setPost(postData);
                    setUserVote(postData.userVote || 0);
                    setUpvotes(postData.upvotes || 0);
                    setDownvotes(postData.downvotes || 0);

                    // console.log(upvotes)
                    // console.log(downvotes)

                    const commentsRes = await api.get(`/posts/${postData.id}/comments`);
                    setComments(commentsRes.data);
                    setCommentCount(commentsRes.data.length);
                } catch (err) {
                    console.error('Failed to fetch post details:', err);
                    setError('Không tìm thấy bài viết.');
                } finally {
                    setLoading(false);
                }
            };
            fetchPost();
        }
    }, [slug, post]);

    // Copy share link
    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    // Vote
    const handleVote = async (type) => {
        if (!user) { alert('Bạn cần đăng nhập để thực hiện chức năng này!'); return; }
        const newVoteType = userVote === type ? 0 : type;
        try {
            const headers = { 'X-Idempotency-Key': crypto.randomUUID() };
            const res = await api.post(`/posts/${post.id}/vote`, { voteType: newVoteType }, { headers });
            setUpvotes(res.data.upvotes);
            setDownvotes(res.data.downvotes);
            setUserVote(res.data.userVote);
        } catch (err) {
            console.error('Failed to vote:', err);
        }
    };

    // Comment submit
    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!user) { alert('Bạn cần đăng nhập để bình luận!'); return; }
        if (!commentContent.trim()) return;
        setSubmittingComment(true);
        try {
            const headers = { 'X-Idempotency-Key': crypto.randomUUID() };
            const res = await api.post(`/posts/${post.id}/comments`, { content: commentContent }, { headers });
            setComments(prev => [res.data, ...prev]);
            setCommentCount(c => c + 1);
            setCommentContent('');
        } catch (err) {
            console.error('Failed to post comment:', err);
            alert('Lỗi khi gửi bình luận');
        } finally {
            setSubmittingComment(false);
        }
    };

    // Reply submit
    const handleReplySubmit = async (e, parentId) => {
        e.preventDefault();
        if (!user) { alert('Bạn cần đăng nhập để bình luận!'); return; }
        if (!replyContent.trim()) return;
        try {
            const headers = { 'X-Idempotency-Key': crypto.randomUUID() };
            const res = await api.post(`/posts/${post.id}/comments`, {
                content: replyContent,
                parentCommentId: parentId
            }, { headers });
            setComments(prev => [...prev, res.data]);
            setCommentCount(c => c + 1);
            setReplyContent('');
            setReplyingTo(null);
        } catch (err) {
            console.error('Failed to post reply:', err);
            alert('Lỗi khi gửi câu trả lời');
        }
    };

    // Delete comment
    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này không?')) return;
        try {
            await api.delete(`/posts/${post.id}/comments/${commentId}`);
            setComments(prev => prev.filter(c => c.id !== commentId));
            setCommentCount(c => c - 1);
        } catch (err) {
            alert('Xóa bình luận thất bại');
        }
    };

    // Render comment tree
    const renderComments = (parentId = null, depth = 0) => {
        let children = comments.filter(c => c.parentCommentId === parentId);
        if (parentId !== null) {
            children = [...children].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }
        if (children.length === 0) return null;

        return children.map(c => {
            const isOwner = user?.id === post?.authorId;
            const isAdmin = user?.isAdmin;
            const isCommentOwner = user?.id === c.authorId;
            const canDelete = isCommentOwner || isAdmin || isOwner;
            const createdStr = c.createdAt.endsWith('Z') ? c.createdAt : c.createdAt + 'Z';

            return (
                <div key={c.id} style={{
                    marginLeft: depth > 0 ? '2rem' : '0',
                    borderLeft: depth > 0 ? '2px solid var(--border)' : 'none',
                    paddingLeft: depth > 0 ? '1rem' : '0',
                    marginTop: '1rem',
                }}>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <img
                            src={c.authorProfilePicture || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/cartoon/${c.authorcartoonCharacter}.png`}
                            alt={c.authorName}
                            className="avatar"
                            style={{ width: depth > 0 ? '28px' : '36px', height: depth > 0 ? '28px' : '36px', flexShrink: 0, marginTop: '2px' }}
                        />
                        <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem', padding: '0.75rem 1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)' }}>{c.authorName}</span>
                                {canDelete && (
                                    <button onClick={() => handleDeleteComment(c.id)}
                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0 4px' }}
                                        title="Xóa bình luận"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                            <p style={{ margin: '0.3rem 0 0.5rem', fontSize: depth > 0 ? '0.9rem' : '0.95rem', color: 'var(--text-main)', lineHeight: '1.5', textAlign: 'left' }}>
                                {c.content}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    {formatDistanceToNow(new Date(createdStr), { addSuffix: true, locale: vi })}
                                </span>
                                {user && depth < 3 && (
                                    <button
                                        onClick={() => { setReplyingTo(replyingTo === c.id ? null : c.id); setReplyContent(''); }}
                                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}
                                    >
                                        Trả lời
                                    </button>
                                )}
                            </div>

                            {replyingTo === c.id && (
                                <form onSubmit={(e) => handleReplySubmit(e, c.id)} style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input
                                        className="comment-input"
                                        placeholder={`Trả lời ${c.authorName}...`}
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        maxLength={500}
                                        autoFocus
                                        style={{ flex: 1, fontSize: '0.85rem', padding: '0.5rem 0.75rem', borderRadius: '1rem', border: '1px solid var(--border)', background: 'var(--bg-dark)', color: 'var(--text-main)' }}
                                    />
                                    <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '0.25rem' }}>
                                        <Send size={16} />
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                    {renderComments(c.id, depth + 1)}
                </div>
            );
        });
    };

    // Guards
    if (loading) {
        return (
            <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div className="loader maybe-is-birthday-card">Đang tải bài viết...</div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <h2 style={{ color: 'var(--text-main)', marginBottom: '1.5rem' }}>{error || 'Không tìm thấy bài viết'}</h2>
                <button
                    onClick={() => navigate('/')}
                    className="auth-btn"
                    style={{ maxWidth: '200px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                    <ArrowLeft size={18} /> Quay lại trang chủ
                </button>
            </div>
        );
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
    const baseUrl = apiUrl.replace('/api', '');
    const imageUrl = post.imageUrl
        ? (post.imageUrl.startsWith('http') ? post.imageUrl : `${baseUrl}${post.imageUrl}`)
        : null;

    // Render 
    return (
        <div className="container post-details-container" style={{ maxWidth: '900px', margin: '2rem auto' }}>
            {/* Back button */}
            <div className='post-details-container__bcontainer'>
                <div className='post-details-container__back-button--desktop'>
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            background: 'none', border: 'none', color: 'var(--text-muted)',
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            cursor: 'pointer', padding: '0.5rem 0', fontSize: '0.95rem', transition: 'color 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'}
                        onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                        &lt; Quay lại
                    </button>
                </div>
            </div>

            {/* Title overlay on banner */}
            <div className='h1-container'>
                <h1 className='master-post-title' style={{
                    fontSize: '2.5rem', fontWeight: '800', lineHeight: '1.2',
                    marginBottom: '1.5rem', textAlign: 'left',
                    color: 'white', maxWidth: '1200px'
                }}>
                    {post.title}
                </h1>
                <h2 className='ola-olle'>Thông tin về bài viết {post.title} trong {post.groupName}</h2>
            </div>


            {/* Banner image */}
            <div
                className='image-post-as-banner-container'
                style={{ width: '100%', maxHeight: '25rem', overflow: 'hidden' }}
            >
                <img
                    className='image-post-as-banner'
                    src={imageUrl || `${process.env.NEXT_PUBLIC_APP_URL}/bg.jpg`}
                    alt={post.title || 'Bài viết trên nền tảng BlogSocial'}
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'block',
                        objectFit: 'cover'
                    }}
                />
            </div>

            {/* Breadcrumb */}
            <div className='breadcrumb-container'>
                <ul>
                    <li><Link to='/'>Trang chủ</Link></li>
                    <li><Link to={`/groups/${post.groupSlug}`}>{post.groupName}</Link></li>
                    <li className='limit-chars__li'>{post.title}</li>
                </ul>
            </div>

            {/* Post card */}
            <article className="post-card post-card-details" style={{
                padding: '0', overflow: 'hidden',
                border: '1px solid var(--border)', background: 'var(--card-dark)',
                borderRadius: '1.5rem', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.3)'
            }}>
                <div style={{ padding: '1.5rem' }}>

                    {/* Author row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Link to={`/profile/${post.authorId}`} style={{ textDecoration: 'none' }}>
                                <img
                                    src={post.authorProfilePicture || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/cartoon/${post.authorcartoonCharacter}.png`}
                                    alt={post.authorName}
                                    style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid var(--primary)', objectFit: 'cover' }}
                                />
                            </Link>
                            <div>
                                <Link to={`/profile/${post.authorId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <h3 className='author-name-title' style={{ margin: '0', fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)' }}>{post.authorName}</h3>
                                </Link>
                                <div className='column-details-container' style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                                    <span className='time-post-details' style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        {formatDistanceToNow(new Date(post.createdAt + (post.createdAt.endsWith('Z') ? '' : 'Z')), { addSuffix: true, locale: vi })}
                                    </span>
                                    {post.location && (
                                        <span className='location-details' style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}> {post.location}</span>
                                    )}
                                </div>
                            </div>
                        </div>


                    </div>

                    {/* Content */}
                    <div
                        className="post-content ql-viewer"
                        style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--text-main)', textAlign: 'left' }}
                        dangerouslySetInnerHTML={{ __html: safeSanitize(post.content) }}
                        suppressHydrationWarning
                    />

                    {/* Group tag */}
                    {post.groupName && (
                        <div style={{ marginTop: '2.5rem', padding: '1.25rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '1rem', border: '1px dashed var(--primary)', display: 'flex', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Bài viết từ nhóm: &nbsp;</span>
                            <Link to={`/groups/${post.groupSlug}`} style={{ textDecoration: 'none', color: 'var(--primary)', fontWeight: '700', fontSize: '1.1rem' }}>
                                {post.groupName}
                            </Link>
                        </div>
                    )}

                    {/* Vote + Comment count bar */}
                    <div style={{ marginTop: '3rem', display: 'flex', alignItems: 'center', gap: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button
                                onClick={() => handleVote(1)}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'none', border: 'none', cursor: 'pointer', color: userVote === 1 ? 'var(--primary)' : 'var(--text-muted)', padding: '0.5rem', transition: 'all 0.2s' }}
                            >
                                <ThumbsUp size={18} fill={userVote === 1 ? 'currentColor' : 'none'} />
                                <span style={{ fontSize: '1.1rem' }}>{upvotes}</span>
                            </button>
                            <button
                                onClick={() => handleVote(-1)}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'none', border: 'none', cursor: 'pointer', color: userVote === -1 ? '#f43f5e' : 'var(--text-muted)', padding: '0.5rem', transition: 'all 0.2s' }}
                            >
                                <ThumbsDown size={18} fill={userVote === -1 ? 'currentColor' : 'none'} />
                                <span style={{ fontSize: '1.1rem' }}>{downvotes}</span>
                            </button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-muted)' }}>
                            <MessageCircle size={18} />
                            <span style={{ fontSize: '1.1rem' }}>{commentCount}</span>
                        </div>

                        {/* Share button */}
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                onClick={handleCopyLink}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.5rem', borderRadius: '0.75rem',
                                    background: copied ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                    color: copied ? 'white' : 'var(--text-main)',
                                    border: '1px solid var(--border)', cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                    fontSize: '0.75rem', fontWeight: '500'
                                }}
                            >
                                {copied ? <Check size={18} /> : <Share2 size={18} />}
                                {copied ? 'Đã sao chép' : 'Chia sẻ'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ─── Comments section ───────────────────────────────────── */}
                <div style={{ borderTop: '1px solid var(--border)', padding: '2rem 2.5rem' }}>
                    <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)', textAlign: 'left' }}>
                        Bình luận ({commentCount})
                    </h3>

                    {/* New comment input */}
                    {user ? (
                        <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '2rem' }}>
                            <img
                                src={user.profilePicture || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/cartoon/${user.cartoonCharacter}.png`}
                                alt={user.displayName}
                                className="avatar"
                                style={{ width: '40px', height: '40px', flexShrink: 0, marginTop: '4px' }}
                            />
                            <div style={{ flex: 1, display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: '1.25rem', border: '1px solid var(--border)', padding: '0.5rem 0.75rem' }}>
                                <input
                                    className="comment-input"
                                    placeholder="Viết bình luận..."
                                    value={commentContent}
                                    onChange={(e) => setCommentContent(e.target.value)}
                                    maxLength={500}
                                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-main)', fontSize: '0.95rem', padding: '0.25rem 0.5rem' }}
                                />
                                <button
                                    type="submit"
                                    disabled={submittingComment || !commentContent.trim()}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: commentContent.trim() ? 'var(--primary)' : 'var(--text-muted)', transition: 'color 0.2s', padding: '0.25rem' }}
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>Đăng nhập</Link> để tham gia bình luận
                        </div>
                    )}

                    {/* Comment list */}
                    {loadingComments ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }} className="maybe-is-birthday-card">
                            Đang tải bình luận...
                        </div>
                    ) : (
                        <div>
                            {comments.length > 0 ? (
                                renderComments(null, 0)
                            ) : (
                                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                                    Chưa có bình luận nào. Hãy là người đầu tiên! 🥰
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </article>
            {/* Back */}
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                <button className='back-button-bottom-post-details' onClick={() => navigate(-1)} style={{ background: 'none', color: 'var(--primary)', textDecoration: 'none', fontWeight: '500', cursor: 'pointer' }}>Quay lại</button>
            </div>
        </div>
    );
};

export default PostDetails;


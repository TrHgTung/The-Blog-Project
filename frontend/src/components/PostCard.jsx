'use client';
import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Link } from '@/next-compat';
import { useAuth } from '../context/AuthContext';
import { Edit, Trash2, ThumbsUp, ThumbsDown, MapPin, MessageCircle, Send } from 'lucide-react';
import { format } from 'date-fns';
import api from '../services/api';
import DOMPurify from 'dompurify';

const safeSanitize = (html) => {
    if (typeof window === 'undefined') return html; // Return html on server so hydration matches client
    if (DOMPurify && typeof DOMPurify.sanitize === 'function') {
        return DOMPurify.sanitize(html);
    } else if (DOMPurify && DOMPurify.default && typeof DOMPurify.default.sanitize === 'function') {
        return DOMPurify.default.sanitize(html);
    }
    return html;
};

const PostCard = ({ post, onDelete }) => {
    const { user } = useAuth();
    const isOwner = user?.id === post.authorId;
    const isAdmin = user?.isAdmin;

    const isGroupCreator = post.groupCreatorId === user?.id;

    const handleDelete = async () => {
        if (window.confirm('Bạn có chắc muốn xóa vĩnh viễn bài viết này?')) {
            try {
                await api.delete(`/posts/${post.id}`);
                onDelete(post.id);
                alert('Bài viết đang trong quá trình xóa, hệ thống sẽ cập nhật trong giây lát');
            } catch (err) {
                console.log(err);
                alert('Không tìm thấy bài viết để xóa, thao tác thất bại');
            }
        }
    };

    const [upvotes, setUpvotes] = useState(post.upvotes || 0);
    const [downvotes, setDownvotes] = useState(post.downvotes || 0);
    const [userVote, setUserVote] = useState(post.userVote || 0);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentContent, setCommentContent] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyContent, setReplyContent] = useState('');

    const toggleComments = async () => {
        if (!showComments) {
            setLoadingComments(true);
            try {
                const response = await api.get(`/posts/${post.id}/comments`);
                setComments(response.data);
            } catch (err) {
                console.error('Failed to fetch comments:', err);
            } finally {
                setLoadingComments(false);
            }
        }
        setShowComments(!showComments);
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            alert('Bạn cần đăng nhập để bình luận!');
            return;
        }
        if (!commentContent.trim()) return;

        try {
            const response = await api.post(`/posts/${post.id}/comments`, { content: commentContent });
            setComments([response.data, ...comments]);
            setCommentContent('');
        } catch (err) {
            console.error('Failed to post comment:', err);
            alert('Lỗi khi gửi bình luận');
        }
    };

    const handleReplySubmit = async (e, parentId) => {
        e.preventDefault();
        if (!user) {
            alert('Bạn cần đăng nhập để bình luận!');
            return;
        }
        if (!replyContent.trim()) return;

        try {
            const response = await api.post(`/posts/${post.id}/comments`, {
                content: replyContent,
                parentCommentId: parentId
            });
            // Append to comments
            setComments([...comments, response.data]);
            setReplyContent('');
            setReplyingTo(null);
        } catch (err) {
            console.error('Failed to post reply:', err);
            alert('Lỗi khi gửi câu trả lời');
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa bình luận này không?')) {
            try {
                await api.delete(`/posts/${post.id}/comments/${commentId}`);
                setComments(comments.filter(c => c.id !== commentId));
            } catch (err) {
                alert('Xóa bình luận thất bại');
            }
        }
    };

    const renderComments = (parentId = null, depth = 0) => {
        // Child comments ordered by old to new makes better sense for replies, or keep API order.
        // API gives descending by CreatedAt. For replies, usually oldest first (like a chat) is preferred.
        let childComments = comments.filter(c => c.parentCommentId === parentId);
        if (parentId !== null) {
            // Reverse so oldest is top for sub-comments
            childComments = [...childComments].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }

        if (childComments.length === 0) return null;

        return childComments.map(c => {
            const isCommentOwner = user?.id === c.authorId;
            const canDeleteComment = isCommentOwner || isAdmin || isOwner;

            return (
                <div key={c.id} className="comment-item" style={{
                    marginLeft: depth > 0 ? '2rem' : '0',
                    borderLeft: depth > 0 ? '2px solid var(--border-color)' : 'none',
                    paddingLeft: depth > 0 ? '1rem' : '0',
                    marginTop: depth > 0 ? '0.5rem' : '0',
                    display: 'flex', flexDirection: 'column'
                }}>
                    <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                        <img
                            src={c.authorProfilePicture || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/cartoon/${c.authorcartoonCharacter}.png`}
                            className="avatar"
                            style={{ width: depth > 0 ? '28px' : '36px', height: depth > 0 ? '28px' : '36px', marginTop: '4px' }}
                            alt={c.authorName}
                        />
                        <div className="comment-body" style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div className="comment-author" style={{ fontSize: depth > 0 ? '0.85rem' : '0.9rem' }}>{c.authorName}</div>
                                {canDeleteComment && (
                                    <button
                                        onClick={() => handleDeleteComment(c.id)}
                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0 4px' }}
                                        title="Xóa bình luận"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                            <div className="comment-text" style={{ fontSize: depth > 0 ? '0.9rem' : '0.95rem' }}>{c.content}</div>
                            <div className="comment-time" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.2rem' }}>
                                <span>{formatDistanceToNow(new Date(!c.createdAt.endsWith('Z') ? c.createdAt + 'Z' : c.createdAt), { addSuffix: true, locale: vi })}</span>
                                {user && (
                                    <button
                                        onClick={() => {
                                            setReplyingTo(replyingTo === c.id ? null : c.id);
                                            setReplyContent('');
                                        }}
                                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}
                                    >
                                        Trả lời
                                    </button>
                                )}
                            </div>
                            {replyingTo === c.id && (
                                <form className="comment-form" onSubmit={(e) => handleReplySubmit(e, c.id)} style={{ marginTop: '0.5rem', background: 'transparent' }}>
                                    <div className="comment-input-group" style={{ padding: '0.2rem 0', border: 'none' }}>
                                        <input
                                            className="comment-input"
                                            placeholder={`Trả lời ${c.authorName}...`}
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                            maxLength={500}
                                            style={{ fontSize: '0.85rem', padding: '0.6rem', border: '1px solid var(--border-color)', borderRadius: '1rem' }}
                                            autoFocus
                                        />
                                        <button type="submit" className="nav-link" style={{ border: 'none', background: 'none', padding: '0.4rem' }}>
                                            <Send size={16} color="var(--primary)" />
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                    {renderComments(c.id, depth + 1)}
                </div>
            );
        });
    };

    const handleVote = async (type) => {
        if (!user) {
            alert('Bạn cần đăng nhập để thực hiện chức năng này!');
            return;
        }

        // Toggling vote
        let newVoteType = type;
        if (userVote === type) {
            newVoteType = 0; // Remove vote
        }

        try {
            const response = await api.post(`/posts/${post.id}/vote`, { voteType: newVoteType });
            setUpvotes(response.data.upvotes);
            setDownvotes(response.data.downvotes);
            setUserVote(response.data.userVote);
        } catch (err) {
            console.error('Failed to vote:', err);
            // Optionally, we could keep the optimistic update and revert here, but let's just use response
        }
    };

    return (
        <article className="post-card">
            <div className="post-header">
                <Link to={`/profile/${post.authorId}`} >
                    <img
                        src={post.authorProfilePicture || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/cartoon/${post.authorcartoonCharacter}.png`}
                        alt={post.authorName}
                        className="avatar"
                    />
                </Link>
                <div style={{ flex: 1 }}>
                    <div className='div-28939303092-container' style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Link to={`/profile/${post.authorId}`} className="box-name-hpage" style={{ fontWeight: 600, textDecoration: 'none', color: 'inherit' }}>
                            {post.authorName}
                        </Link>
                        {post.groupName && (
                            <span className="postCard-group-name" style={{ fontSize: '0.8rem', color: 'white' }}>
                                trong <Link to={`/groups/${post.groupSlug}`} style={{ textDecoration: 'none' }}><strong style={{ color: 'var(--primary)' }}>{post.groupName}</strong></Link>
                            </span>
                        )}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'left', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                        <span className='post-time-details-distance'>{formatDistanceToNow(new Date(!post.createdAt.endsWith('Z') ? post.createdAt + 'Z' : post.createdAt), { addSuffix: true, locale: vi })}</span>
                        {post.location && (
                            <>
                                <span> • </span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: 'var(--primary)' }} className='limit-char-spec post-location-details'>
                                    <MapPin size={12} /> {post.location}
                                </span>
                            </>
                        )}
                    </div>
                </div>
                {(isOwner || isAdmin || isGroupCreator) && (
                    <div style={{ display: 'flex' }} className='nav-links-container'>
                        {(isOwner || isAdmin) && (
                            <Link to={`/edit-post/${post.id}`} className="nav-link" style={{ color: 'var(--text-muted)' }}>
                                <Edit size={18} />
                            </Link>
                        )}
                        <button onClick={handleDelete} className="nav-logout-btn" style={{ color: 'var(--text-muted)' }}>
                            <Trash2 size={18} />
                        </button>
                    </div>
                )}
            </div>

            <Link to={`/post/${post.slug || post.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="post-body">

                    <h2 className="post-title" style={{
                        transition: 'color 0.2s',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>{post.title}</h2>

                    <div
                        className="post-content ql-viewer"
                        style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 12,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}
                        dangerouslySetInnerHTML={{ __html: safeSanitize(post.content) }}
                        suppressHydrationWarning
                    />
                    {post.imageUrl && (
                        <img
                            src={post.imageUrl.startsWith('http')
                                ? post.imageUrl
                                : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace('/api', '')}${post.imageUrl}`}
                            alt={post.title}
                            className="post-image"
                            style={{ marginTop: '1rem', borderRadius: '0.5rem' }}
                        />
                    )}
                </div>
            </Link>

            <div className="post-footer" style={{ display: 'flex', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                {/* <button
                    onClick={() => handleVote(1)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: userVote === 1 ? 'var(--primary)' : 'var(--text-muted)'
                    }}
                >
                    <span>{upvotes} lượt thích</span>
                </button> */}
                <span style={{fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-muted)'}}><small>Có {upvotes} lượt thích</small></span>
                <button
                    onClick={toggleComments}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: showComments ? 'var(--primary)' : 'var(--text-muted)',
                        marginLeft: 'auto'
                    }}
                >
                    <MessageCircle size={18} />
                    <span>Bình luận</span>
                </button>
            </div>

            {showComments && (
                <div className="comments-section">
                    {user && (
                        <form className="comment-form" onSubmit={handleCommentSubmit}>
                            <div className="comment-input-group">
                                <img
                                    src={user.profilePicture || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/cartoon/${user.cartoonCharacter}.png`}
                                    className="avatar"
                                    style={{ width: '32px', height: '32px' }}
                                    alt={user.displayName}
                                />
                                <input
                                    className="comment-input"
                                    placeholder="Viết bình luận..."
                                    value={commentContent}
                                    onChange={(e) => setCommentContent(e.target.value)}
                                    maxLength={500}
                                />
                                <button type="submit" className="nav-link" style={{ border: 'none', background: 'none' }}>
                                    <Send size={18} />
                                </button>
                            </div>
                        </form>
                    )}

                    {loadingComments ? (
                        <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }} className='maybe-is-birthday-card'>Đang tải bình luận...</div>
                    ) : (
                        <div className="comment-list">
                            {comments.length > 0 ? (
                                renderComments(null, 0)
                            ) : (
                                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                    Chưa có bình luận nào. Hãy là người đầu tiên!
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </article>
    );
};

export default PostCard;



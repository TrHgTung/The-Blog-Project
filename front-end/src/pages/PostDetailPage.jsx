import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
    ThumbsUp,
    ThumbsDown,
    MessageSquare,
    User as UserIcon,
    Calendar,
    ArrowLeft,
    Send,
    MoreVertical,
    Share2
} from 'lucide-react';

const PostDetailPage = () => {
    const { slug } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [voteCount, setVoteCount] = useState({ up: 0, down: 0 });
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');

    useEffect(() => {
        const fetchPostContent = async () => {
            try {
                // fetch post details by slug
                const postRes = await api.get(`/api/user-service/PostTopic/get-post-by-slug/${slug}`);
                console.log('Post Data Response:', postRes.data);

                const postData = postRes.data.postDetails || postRes.data.PostDetails;

                if (postData) {
                    setPost(postData);
                    setVoteCount({
                        up: postRes.data.upvotes || postRes.data.Upvotes || 0,
                        down: postRes.data.downvotes || postRes.data.Downvotes || 0
                    });

                    // fetch comments for this post
                    const commentsRes = await api.get(`/api/user-service/PostTopic/show-all-comments/${postData.id}`);
                    console.log('Comments Data Response:', commentsRes.data);

                    const cmts = commentsRes.data.comments || commentsRes.data.Comments || [];

                    // Fetch replies for each comment
                    const cmtsWithReplies = await Promise.all(cmts.map(async (c) => {
                        try {
                            const repliesRes = await api.get(`/api/user-service/PostTopic/show-all-replies/${c.id}`);
                            return { ...c, replies: repliesRes.data.replies || repliesRes.data.Replies || [] };
                        } catch {
                            return { ...c, replies: [] };
                        }
                    }));

                    setComments(cmtsWithReplies);
                }

            } catch (err) {
                console.error('Error fetching post details:', err);
                if (err.response?.status === 404) {
                    // Could be a mock post
                    if (slug === 'welcome-mock') {
                        setPost({
                            id: 'mock-id',
                            postTitle: "Chào mừng đến với The Blog Social",
                            postContent: "Bạn chưa đăng nhập, hãy đăng nhập để khám phá thêm nhé. Đây là nội dung mẫu cho bài viết chào mừng.",
                            authorName: "The Blog Social",
                            authorAvatar: "",
                            createdAt: new Date().toISOString(),
                            backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        });
                        setLoading(false);
                    }
                }
            } finally {
                setLoading(false);
            }
        };

        fetchPostContent();
    }, [slug]);

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            navigate('/login');
            return;
        }
        if (!newComment.trim()) return;

        setSubmittingComment(true);
        try {
            const res = await api.post(`/api/user-service/PostTopic/create-comment/${post.id}`, {
                commentContent: newComment
            });

            const commentData = res.data.success_comment;
            const newCommentObj = {
                ...commentData,
                authorName: user.username,
                authorAvatar: user.avatarImage,
                replies: []
            };

            setComments([newCommentObj, ...comments]);
            setNewComment('');
        } catch (err) {
            console.error('Failed to post comment:', err);
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleReplySubmit = async (commentId) => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (!replyText.trim()) return;

        try {
            const res = await api.post(`/api/user-service/PostTopic/create-reply/${commentId}`, {
                replyCmtContent: replyText
            });

            const replyData = res.data.success_reply;
            const newReplyObj = {
                ...replyData,
                authorName: user.username,
                authorAvatar: user.avatarImage
            };

            setComments(comments.map(c =>
                c.id === commentId ? { ...c, replies: [...(c.replies || []), newReplyObj] } : c
            ));
            setReplyingTo(null);
            setReplyText('');
        } catch (err) {
            console.error('Failed to post reply:', err);
        }
    };

    const handleVote = async (type) => {
        if (!user) {
            navigate('/login');
            return;
        }
        try {
            await api.post(`/api/user-service/PostTopic/${type}/${post.id}`);
            // Update local state for immediate feedback
            setVoteCount(prev => ({
                ...prev,
                [type === 'upvote' ? 'up' : 'down']: prev[type === 'upvote' ? 'up' : 'down'] + 1
            }));
        } catch (err) {
            console.error('Vote failed:', err);
        }
    };

    if (loading) return <div className="loading-container"><div className="loader"></div></div>;
    if (!post) return <div className="error-container"><h2>Không tìm thấy bài viết</h2><button onClick={() => navigate('/')}>Quay về trang chủ</button></div>;

    const formattedDate = new Date(post.createdAt).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div className="post-detail-container">
            <div className="post-header-actions">
                <button className="back-link" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} /> Quay lại
                </button>
                <div className="header-right">
                    <button className="icon-btn"><Share2 size={18} /></button>
                    <button className="icon-btn"><MoreVertical size={18} /></button>
                </div>
            </div>

            <article className="post-article glass-card">
                {post.heroImage && (
                    <div className="post-hero">
                        <img src={post.heroImage} alt={post.postTitle} className="hero-img" />
                    </div>
                )}

                <div className="post-content-wrapper">
                    <div className="post-meta-top">
                        <Link to={`/user/${post.userId}`} className="post-author">
                            <img
                                src={post.authorAvatar || `https://ui-avatars.com/api/?name=${post.authorName}&background=random`}
                                alt={post.authorName}
                                className="author-avatar"
                            />
                            <div className="author-meta">
                                <span className="author-name">{post.authorName}</span>
                                <span className="post-date"><Calendar size={12} /> {formattedDate}</span>
                            </div>
                        </Link>
                    </div>

                    <h1 className="post-title">{post.postTitle}</h1>

                    <div className="post-body">
                        {post.postContent.split('\n').map((paragraph, idx) => (
                            <p key={idx}>{paragraph}</p>
                        ))}
                    </div>

                    <div className="post-footer-actions">
                        <div className="vote-section">
                            <button className="vote-btn up" onClick={() => handleVote('upvote')}>
                                <ThumbsUp size={20} /> <span>{voteCount.up}</span>
                            </button>
                            <button className="vote-btn down" onClick={() => handleVote('downvote')}>
                                <ThumbsDown size={20} /> <span>{voteCount.down}</span>
                            </button>
                        </div>
                        <div className="comment-count">
                            <MessageSquare size={20} /> <span>{comments.length} Bình luận</span>
                        </div>
                    </div>
                </div>
            </article>

            <section className="comments-section">
                <h3 className="section-title">Bình luận</h3>

                <form className="comment-form glass-card" onSubmit={handleCommentSubmit}>
                    <img
                        src={user?.avatarImage || `https://ui-avatars.com/api/?name=${user?.username || 'G'}&background=random`}
                        alt="My profile"
                        className="my-avatar"
                    />
                    <div className="input-wrapper">
                        <textarea
                            placeholder="Viết bình luận của bạn..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            disabled={submittingComment}
                        ></textarea>
                        <button type="submit" className="send-btn" disabled={submittingComment || !newComment.trim()}>
                            {submittingComment ? '...' : <Send size={18} />}
                        </button>
                    </div>
                </form>

                <div className="comments-list">
                    {comments.length > 0 ? (
                        comments.map(comment => (
                            <div key={comment.id} className="comment-group">
                                <div className="comment-item glass-card">
                                    <Link to={`/user/${comment.userId}`} className="comment-author-img">
                                        <img
                                            src={comment.authorAvatar || `https://ui-avatars.com/api/?name=${comment.authorName}&background=random`}
                                            alt={comment.authorName}
                                        />
                                    </Link>
                                    <div className="comment-content">
                                        <div className="comment-header">
                                            <Link to={`/user/${comment.userId}`} className="comment-author-name">
                                                {comment.authorName}
                                            </Link>
                                            <span className="comment-time">
                                                {new Date(comment.createdAt).toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>
                                        <p className="comment-text">{comment.commentContent}</p>
                                        <div className="comment-actions">
                                            <button className="text-btn" onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}>
                                                {replyingTo === comment.id ? 'Hủy' : 'Trả lời'}
                                            </button>
                                            <button className="text-btn">Thích</button>
                                        </div>

                                        {replyingTo === comment.id && (
                                            <div className="reply-form-mini">
                                                <input
                                                    type="text"
                                                    placeholder="Viết câu trả lời..."
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleReplySubmit(comment.id)}
                                                    autoFocus
                                                />
                                                <button onClick={() => handleReplySubmit(comment.id)} disabled={!replyText.trim()}>Gửi</button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Replies List */}
                                {comment.replies && comment.replies.length > 0 && (
                                    <div className="replies-container">
                                        {comment.replies.map(reply => (
                                            <div key={reply.id} className="reply-item glass-card">
                                                <Link to={`/user/${reply.userId}`} className="comment-author-img-small">
                                                    <img
                                                        src={reply.authorAvatar || `https://ui-avatars.com/api/?name=${reply.authorName}&background=random`}
                                                        alt={reply.authorName}
                                                    />
                                                </Link>
                                                <div className="comment-content">
                                                    <div className="comment-header">
                                                        <Link to={`/user/${reply.userId}`} className="comment-author-name small">
                                                            {reply.authorName}
                                                        </Link>
                                                        <span className="comment-time">
                                                            {new Date(reply.createdAt).toLocaleDateString('vi-VN')}
                                                        </span>
                                                    </div>
                                                    <p className="comment-text small">{reply.replyCmtContent}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="no-comments glass-card">
                            <p>Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                        </div>
                    )}
                </div>
            </section>

            <style>{`
                .comment-group {
                    margin-bottom: 1.5rem;
                }
                .replies-container {
                    margin-left: 3rem;
                    margin-top: 0.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    border-left: 2px solid var(--glass-border);
                    padding-left: 1rem;
                }
                .reply-item {
                    display: flex;
                    gap: 0.8rem;
                    padding: 0.8rem 1rem;
                    background: rgba(255, 255, 255, 0.03);
                }
                .comment-author-img-small img {
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                }
                .comment-text.small {
                    font-size: 0.95rem;
                }
                .comment-author-name.small {
                    font-size: 0.9rem;
                }
                .reply-form-mini {
                    display: flex;
                    gap: 0.5rem;
                    margin-top: 0.8rem;
                    animation: slideDown 0.3s ease;
                }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .reply-form-mini input {
                    flex: 1;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid var(--glass-border);
                    border-radius: 8px;
                    padding: 0.4rem 0.8rem;
                    color: var(--text-main);
                    font-size: 0.9rem;
                }
                .reply-form-mini input:focus {
                    outline: none;
                    border-color: var(--primary);
                }
                .reply-form-mini button {
                    background: var(--primary);
                    color: white;
                    border: none;
                    padding: 0.4rem 1rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.9rem;
                }
                .reply-form-mini button:disabled {
                    opacity: 0.5;
                }
                .post-detail-container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 2rem 1rem;
                }
                .post-header-actions {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }
                .back-link {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: none;
                    border: none;
                    color: var(--text-muted);
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    padding: 0.5rem;
                    border-radius: 8px;
                }
                .back-link:hover {
                    color: var(--primary);
                    background: rgba(var(--primary-rgb), 0.1);
                }
                .header-right {
                    display: flex;
                    gap: 0.5rem;
                }
                .icon-btn {
                    padding: 0.6rem;
                    border-radius: 50%;
                    border: none;
                    background: var(--glass-bg);
                    color: var(--text-main);
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .icon-btn:hover {
                    background: var(--primary);
                    color: white;
                }
                .post-article {
                    overflow: hidden;
                    margin-bottom: 2rem;
                    transition: transform 0.3s ease;
                }
                .post-hero {
                    width: 100%;
                    max-height: 400px;
                    overflow: hidden;
                }
                .hero-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .post-content-wrapper {
                    padding: 2.5rem;
                }
                .post-meta-top {
                    margin-bottom: 1.5rem;
                }
                .post-author {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    text-decoration: none;
                    color: inherit;
                }
                .author-avatar {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    border: 2px solid var(--primary);
                    padding: 2px;
                }
                .author-meta {
                    display: flex;
                    flex-direction: column;
                }
                .author-name {
                    font-weight: 600;
                    color: var(--text-main);
                }
                .post-date {
                    font-size: 0.85rem;
                    color: var(--text-muted);
                    display: flex;
                    align-items: center;
                    gap: 0.3rem;
                }
                .post-title {
                    font-size: 2.5rem;
                    font-weight: 800;
                    margin-bottom: 2rem;
                    line-height: 1.2;
                    background: linear-gradient(135deg, var(--text-main) 0%, var(--primary) 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .post-body {
                    line-height: 1.8;
                    font-size: 1.15rem;
                    color: var(--text-main);
                    margin-bottom: 3rem;
                }
                .post-body p {
                    margin-bottom: 1.5rem;
                }
                .post-footer-actions {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 1.5rem;
                    border-top: 1px solid var(--glass-border);
                }
                .vote-section {
                    display: flex;
                    gap: 1rem;
                }
                .vote-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.6rem 1.2rem;
                    border-radius: 30px;
                    border: 1px solid var(--glass-border);
                    background: var(--glass-bg);
                    color: var(--text-main);
                    cursor: pointer;
                    transition: all 0.3s;
                    font-weight: 600;
                }
                .vote-btn.up:hover {
                    color: #10b981;
                    border-color: #10b981;
                    background: rgba(16, 185, 129, 0.1);
                }
                .vote-btn.down:hover {
                    color: #ef4444;
                    border-color: #ef4444;
                    background: rgba(239, 68, 68, 0.1);
                }
                .comment-count {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--text-muted);
                    font-weight: 500;
                }
                .comments-section {
                    margin-top: 3rem;
                }
                .section-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-bottom: 1.5rem;
                }
                .comment-form {
                    display: flex;
                    gap: 1rem;
                    padding: 1.5rem;
                    margin-bottom: 2rem;
                }
                .my-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                }
                .input-wrapper {
                    flex: 1;
                    position: relative;
                }
                .input-wrapper textarea {
                    width: 100%;
                    min-height: 100px;
                    padding: 1rem;
                    border-radius: 12px;
                    border: 1px solid var(--glass-border);
                    background: rgba(255, 255, 255, 0.05);
                    color: var(--text-main);
                    resize: none;
                    font-family: inherit;
                    transition: border-color 0.2s;
                }
                .input-wrapper textarea:focus {
                    outline: none;
                    border-color: var(--primary);
                }
                .send-btn {
                    position: absolute;
                    bottom: 1rem;
                    right: 1rem;
                    background: var(--primary);
                    color: white;
                    border: none;
                    padding: 0.6rem;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .send-btn:hover:not(:disabled) {
                    transform: scale(1.05);
                    box-shadow: 0 0 15px rgba(var(--primary-rgb), 0.4);
                }
                .send-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .comment-item {
                    display: flex;
                    gap: 1rem;
                    padding: 1.5rem;
                    margin-bottom: 1rem;
                    animation: fadeIn 0.4s ease forwards;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .comment-author-img img {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    object-fit: cover;
                }
                .comment-content {
                    flex: 1;
                }
                .comment-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.5rem;
                }
                .comment-author-name {
                    font-weight: 600;
                    color: var(--text-main);
                    text-decoration: none;
                }
                .comment-time {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                }
                .comment-text {
                    line-height: 1.6;
                    color: var(--text-main);
                    margin-bottom: 0.8rem;
                }
                .comment-actions {
                    display: flex;
                    gap: 1.5rem;
                }
                .text-btn {
                    background: none;
                    border: none;
                    font-size: 0.85rem;
                    color: var(--text-muted);
                    font-weight: 600;
                    cursor: pointer;
                    padding: 0;
                }
                .text-btn:hover {
                    color: var(--primary);
                }
                .no-comments {
                    padding: 3rem;
                    text-align: center;
                    color: var(--text-muted);
                }
                .loading-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 50vh;
                }
                .loader {
                    width: 40px;
                    height: 40px;
                    border: 4px solid var(--glass-border);
                    border-top: 4px solid var(--primary);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default PostDetailPage;

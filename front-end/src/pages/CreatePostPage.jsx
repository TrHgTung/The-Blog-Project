import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Layout, Type, Image as ImageIcon, Palette, MessageSquare, Send } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const CreatePostPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [topics, setTopics] = useState([]);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        postTitle: '',
        postContent: '',
        topicId: '',
        heroImage: '1.png',
        backgroundColor: 'system'
    });

    useEffect(() => {
        const fetchTopics = async () => {
            try {
                const response = await api.get('/api/user-service/UserRecommendation/get-all-topics');
                setTopics(response.data);
                if (response.data.length > 0) {
                    setFormData(prev => ({ ...prev, topicId: response.data[0].id }));
                }
            } catch (err) {
                console.error('Error fetching topics:', err);
                setError('Could not load topics. Please try again later.');
            }
        };

        fetchTopics();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleContentChange = (content) => {
        setFormData(prev => ({ ...prev, postContent: content }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.postTitle || !formData.postContent || !formData.topicId) {
            setError('Please fill in all required fields.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await api.post('/api/user-service/PostTopic/create-post', formData);
            navigate('/');
        } catch (err) {
            console.error('Error creating post:', err);
            setError(err.response?.data?.[0] || 'Failed to create post. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
            ['link', 'image'],
            ['clean']
        ],
    };

    return (
        <div className="app-container">
            <div className="glass-card" style={{ maxWidth: '900px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <MessageSquare size={32} color="var(--primary)" />
                    <h1>Create New Post</h1>
                </div>

                {error && <div className="error-msg">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>
                            <Type size={16} /> Post Title
                        </label>
                        <input
                            type="text"
                            name="postTitle"
                            className="form-input"
                            value={formData.postTitle}
                            onChange={handleChange}
                            placeholder="Enter a catchy title..."
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            <Layout size={16} /> Choose Topic
                        </label>
                        <select
                            name="topicId"
                            className="form-input"
                            value={formData.topicId}
                            onChange={handleChange}
                            required
                            style={{ appearance: 'none' }}
                        >
                            {topics.map(topic => (
                                <option key={topic.id} value={topic.id}>
                                    {topic.topicName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label>
                                <ImageIcon size={16} /> Hero Image
                            </label>
                            <input
                                type="text"
                                name="heroImage"
                                className="form-input"
                                value={formData.heroImage}
                                onChange={handleChange}
                                placeholder="1.png, image-url, etc."
                            />
                        </div>
                        <div className="form-group">
                            <label>
                                <Palette size={16} /> Background Color
                            </label>
                            <input
                                type="text"
                                name="backgroundColor"
                                className="form-input"
                                value={formData.backgroundColor}
                                onChange={handleChange}
                                placeholder="system, #hex, etc."
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '3rem' }}>
                        <label>Post Content</label>
                        <div className="rich-editor-wrapper" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem' }}>
                            <ReactQuill
                                theme="snow"
                                value={formData.postContent}
                                onChange={handleContentChange}
                                modules={quillModules}
                                style={{ height: '300px', marginBottom: '50px', color: 'var(--text-main)' }}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                        {loading ? (
                            'Creating...'
                        ) : (
                            <>
                                <Send size={20} /> Publish Post
                            </>
                        )}
                    </button>
                </form>
            </div>

            <style>{`
                .ql-toolbar.ql-snow {
                    border-color: var(--glass-border);
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 0.5rem 0.5rem 0 0;
                }
                .ql-container.ql-snow {
                    border-color: var(--glass-border);
                    border-radius: 0 0 0.5rem 0.5rem;
                    font-family: inherit;
                    font-size: 1rem;
                }
                .ql-snow .ql-stroke {
                    stroke: var(--text-muted);
                }
                .ql-snow .ql-fill {
                    fill: var(--text-muted);
                }
                .ql-snow .ql-picker {
                    color: var(--text-muted);
                }
                .rich-editor-wrapper {
                    border: 1px solid var(--glass-border);
                    overflow: hidden;
                }
                select.form-input option {
                    background: #1e293b;
                    color: white;
                }
            `}</style>
        </div>
    );
};

export default CreatePostPage;

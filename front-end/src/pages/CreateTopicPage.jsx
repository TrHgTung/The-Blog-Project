import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Type, Image as ImageIcon, Palette, PlusCircle, Send, ArrowLeft } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const CreateTopicPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        topicName: '',
        topicDescription: '',
        topicBackgroundImage: '1.png',
        topicSlug: '',
        topicHashtag: 'all',
        topicBackgroundColor: '#3b82f6', // Default blue
        userId: user?.id || '' // DTO requires it, though backend uses token
    });

    const slugify = (str) => {
        return str
            .toLowerCase()
            .normalize("NFD") // tách dấu tiếng Việt
            .replace(/[\u0300-\u036f]/g, "") // xóa dấu
            .replace(/đ/g, "d")
            .replace(/[^a-z0-9\s-]/g, "") // xóa ký tự đặc biệt
            .replace(/\s+/g, "-") // thay space thành -
            .replace(/-+/g, "-") // xóa --
            .trim();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "topicName") {
            const generatedSlug = slugify(value);

            setFormData({
                ...formData,
                topicName: value,
                topicSlug: generatedSlug
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.topicName || !formData.topicDescription) {
            setError('Vui lòng điền đầy đủ tên và mô tả chủ đề.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Prepare payload according to CreateTopicDto
            const payload = {
                ...formData,
                userId: user?.id // Ensure userId is passed if DTO strictly requires it
            };

            await api.post('/api/user-service/Topic/create-a-topic', payload);
            navigate('/groups');
        } catch (err) {
            console.error('Error creating topic:', err);
            setError(err.response?.data || 'Không thể tạo chủ đề. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-topic-page">
            <button className="back-btn" onClick={() => navigate('/groups')}>
                <ArrowLeft size={18} /> Quay lại danh sách nhóm
            </button>

            <div className="glass-card" style={{ maxWidth: '700px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <PlusCircle size={32} color="var(--primary)" />
                    <h1>Tạo Chủ đề (Nhóm) mới</h1>
                </div>

                {error && <div className="error-msg" style={{ marginBottom: '1.5rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>
                            <Type size={16} /> Tên Chủ đề
                        </label>
                        <input
                            type="text"
                            name="topicName"
                            className="form-input"
                            value={formData.topicName}
                            onChange={handleChange}
                            placeholder="Ví dụ: Lập trình ReactJS, Hội yêu mèo..."
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>
                            <Type size={16} /> Đường dẫn
                        </label>
                        <input
                            type="text"
                            name="topicSlug"
                            className="form-input"
                            value={formData.topicSlug}
                            onChange={handleChange}
                            placeholder="Ví dụ: lap-trinh-reactjs, hoi-yeu-meo..."
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            <Layout size={16} /> Mô tả ngắn
                        </label>
                        <textarea
                            name="topicDescription"
                            className="form-input"
                            value={formData.topicDescription}
                            onChange={handleChange}
                            placeholder="Chia sẻ mục đích của nhóm này..."
                            rows="2"
                            required
                        ></textarea>
                    </div>

                    <div className="form-group">
                        <label>
                            <PlusCircle size={16} /> Hashtags (Ngăn cách bởi dấu gạch ngang)
                        </label>
                        <input
                            type="text"
                            name="topicHashtag"
                            className="form-input"
                            value={formData.topicHashtag}
                            onChange={handleChange}
                            placeholder="Ví dụ: reactjs - frontend - javascript"
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label>
                                <ImageIcon size={16} /> Mã ảnh nền (Icon)
                            </label>
                            <input
                                type="text"
                                name="topicBackgroundImage"
                                className="form-input"
                                value={formData.topicBackgroundImage}
                                onChange={handleChange}
                                placeholder="1.png, 2.png..."
                            />
                        </div>
                        <div className="form-group">
                            <label>
                                <Palette size={16} /> Màu sắc đại diện
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="color"
                                    name="topicBackgroundColor"
                                    value={formData.topicBackgroundColor}
                                    onChange={handleChange}
                                    style={{ width: '40px', height: '42px', padding: '2px', border: 'none', background: 'transparent' }}
                                />
                                <input
                                    type="text"
                                    name="topicBackgroundColor"
                                    className="form-input"
                                    value={formData.topicBackgroundColor}
                                    onChange={handleChange}
                                    placeholder="#hex color"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="preview-section" style={{ marginTop: '2rem', padding: '1.5rem', border: '1px dashed var(--glass-border)', borderRadius: '0.5rem' }}>
                        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Xem trước giao diện thẻ nhóm:</h3>
                        <div className="group-card glass-card" style={{ width: '280px', margin: '0 auto', pointerEvents: 'none' }}>
                            <div className="group-banner" style={{ backgroundColor: formData.topicBackgroundColor }}>
                                {formData.topicName ? formData.topicName[0] : '?'}
                            </div>
                            <div className="group-content" style={{ padding: '1rem' }}>
                                <h3 className="group-name" style={{ margin: '0 0 0.5rem 0' }}>{formData.topicName || 'Tên chủ đề của bạn'}</h3>
                                <p className="group-desc" style={{ fontSize: '0.8rem', opacity: 0.7 }}>{formData.topicDescription || 'Mô tả sẽ hiển thị ở đây...'}</p>
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginTop: '2rem', width: '100% ' }}>
                        {loading ? (
                            'Đang tạo...'
                        ) : (
                            <>
                                <Send size={20} /> Khởi tạo Nhóm
                            </>
                        )}
                    </button>
                </form>
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
                    margin-bottom: 1.5rem;
                    transition: color 0.2s;
                }
                .back-btn:hover {
                    color: var(--text-main);
                }
                .preview-section .group-card {
                    padding: 0;
                    overflow: hidden;
                }
                .preview-section .group-banner {
                    height: 80px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2.5rem;
                    font-weight: bold;
                    color: white;
                }
            `}</style>
        </div>
    );
};

export default CreateTopicPage;

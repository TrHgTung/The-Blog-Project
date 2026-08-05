'use client';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from '@/next-compat';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import 'leaflet/dist/leaflet.css';
import * as nsfwjs from 'nsfwjs';
// import * as tf from '@tensorflow/tfjs';

const ReactQuill = dynamic(
    () => import('react-quill'),
    {
        ssr: false,
        loading: () => <div style={{ height: '200px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }} />
    }
);

// Map component must be fully client-side
const MapView = dynamic(
    () => import('../components/PostMap'),
    {
        ssr: false,
        loading: () => <div style={{ height: '350px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }} />
    }
);

// MapView handles leaflet logic now
import { containsBadWords } from '../utils/profanityFilter';

const CreatePost = () => {
    const { id } = useParams();
    const { isAdmin } = useAuth();
    const isEditMode = !!id;
    useEffect(() => {
        document.title = (isEditMode ? 'Sửa bài viết' : 'Tạo bài viết mới') + ' | BlogSocial';
    }, [isEditMode]);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        imageUrl: '',
        location: '',
        imageFile: null,
        groupId: '',
        idempotencyKey: typeof window !== 'undefined' ? crypto.randomUUID() : ''
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(isEditMode);
    const [error, setError] = useState('');
    const [position, setPosition] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const navigate = useNavigate();

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
            ['link', 'code-block'],
            ['clean']
        ],
    };

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'bullet', 'indent',
        'link', 'code-block'
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch groups user is in
                const groupsRes = await api.get('/groups');
                setGroups(groupsRes.data.filter(g => g.isMember));

                if (isEditMode) {
                    const response = await api.get(`/posts/${id}`);
                    setFormData({
                        title: response.data.title,
                        content: response.data.content,
                        imageUrl: response.data.imageUrl || '',
                        location: response.data.location || '',
                        imageFile: null,
                        groupId: response.data.groupId || ''
                    });
                    if (response.data.imageUrl) {
                        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace('/api', '');
                        setImagePreview(response.data.imageUrl.startsWith('http') ? response.data.imageUrl : `${baseUrl}${response.data.imageUrl}`);
                    }
                } else if (typeof window !== 'undefined') {
                    const searchParams = new URLSearchParams(window.location.search);
                    const groupParam = searchParams.get('group');
                    if (groupParam) {
                        setFormData(prev => ({ ...prev, groupId: groupParam }));
                    }
                }
            } catch (err) {
                setError('Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, isEditMode]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Kiểm tra định dạng file
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];
            if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.heic') && !file.name.toLowerCase().endsWith('.heif')) {
                setError('Vui lòng chọn đúng định dạng ảnh (jpg, png, gif, webp, heic).');
                e.target.value = null; // Reset input
                setImagePreview(null);
                return;
            }

            // Kiểm tra dung lượng (20MB)
            if (file.size > 20 * 1024 * 1024) {
                setError('Ảnh quá lớn! Vui lòng chọn ảnh dưới 20MB.');
                e.target.value = null; // Reset input
                setImagePreview(null);
                return;
            }

            setError(''); // Xóa lỗi cũ nếu có
            setFormData({ ...formData, imageFile: file });
            const reader = new FileReader();
            reader.onloadend = async () => {
                setImagePreview(reader.result);

                // --- Kiểm tra ảnh nhạy cảm (NSFW) ---
                setIsAnalyzing(true);
                try {
                    const img = new Image();
                    img.src = reader.result;
                    img.onload = async () => {
                        try {
                            const model = await nsfwjs.load();
                            const predictions = await model.classify(img);

                            const nsfwCategories = ['Porn', 'Hentai', 'Sexy'];
                            const isUnsafe = predictions.some(p =>
                                nsfwCategories.includes(p.className) && p.probability > 0.6
                            );

                            if (isUnsafe) {
                                setError('Hình ảnh có vẻ chứa nội dung không phù hợp. Vui lòng chọn ảnh khác.');
                                setFormData({ ...formData, imageFile: null });
                                setImagePreview(null);
                            }
                        } catch (err) {
                            console.error("NSFW detection error:", err);
                        } finally {
                            setIsAnalyzing(false);
                        }
                    };
                } catch (err) {
                    setIsAnalyzing(false);
                }
            };
            reader.readAsDataURL(file);
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate content length (approximate, stripping HTML tags)
        const textOnly = formData.content.replace(/<[^>]*>/g, '');
        if (textOnly.length > 5000) {
            setError('Nội dung quá dài! Vui lòng viết dưới 5000 ký tự.');
            return;
        }

        if (!isAdmin && containsBadWords(formData.title)) {
            setError('Tiêu đề chứa từ ngữ không hợp lệ.');
            return;
        }

        if (!isAdmin && containsBadWords(textOnly)) {
            setError('Nội dung chứa từ ngữ không hợp lệ.');
            return;
        }

        const data = new FormData();
        data.append('title', formData.title);
        data.append('content', formData.content);
        if (formData.location) data.append('location', formData.location);
        if (formData.groupId) data.append('groupId', formData.groupId);
        if (formData.imageFile) {
            data.append('imageFile', formData.imageFile);
        } else if (formData.imageUrl) {
            data.append('imageUrl', formData.imageUrl);
        }

        try {
            const headers = {
                'X-Idempotency-Key': formData.idempotencyKey || crypto.randomUUID()
            };

            if (isEditMode) {
                await api.put(`/posts/${id}`, data);
            } else {
                await api.post('/posts', data, { headers });
            }
            navigate('/');
        } catch (err) {
            setError(err.response?.data || 'Failed to save post');
        }
    };

    if (loading) return <div className="container maybe-is-birthday-card" >Đang tải dữ liệu...</div>;

    return (
        <div className="container" style={{ maxWidth: '1200px' }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="auth-card"
                style={{ maxWidth: 'none' }}
            >
                <h1 className="auth-title">{isEditMode ? 'Sửa bài viết' : 'Tạo bài viết mới'}</h1>
                {error && <div className="error-msg" style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Tiêu đề</label>
                        <input
                            className="form-input"
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            maxLength={100}
                            required
                        />
                    </div>

                    <div className="form-group" style={{ zIndex: 0 }}>
                        <label className="form-label">Địa điểm Check-in (Chọn trên bản đồ hoặc nhập tay)</label>
                        <div style={{ height: '350px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: '0.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                            <MapView
                                position={position}
                                setPosition={setPosition}
                                setLocation={(loc) => setFormData({ ...formData, location: loc })}
                            />
                        </div>
                    </div>
                    <input
                        className="form-input"
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Ví dụ: TP. Hồ Chí Minh, Quán cà phê..."
                        maxLength={100}
                    />

                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 1fr', gap: '1rem', marginTop: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Ảnh đại diện bài viết</label>
                            <input
                                className="form-input"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                style={{ padding: '8px' }}
                            />
                            {imagePreview && (
                                <div style={{ marginTop: '10px', position: 'relative' }}>
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => { setImagePreview(null); setFormData({ ...formData, imageFile: null, imageUrl: '' }); }}
                                        style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}
                                    >
                                        ×
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Đăng vào nhóm (Tùy chọn)</label>
                            <select
                                className="form-input"
                                value={formData.groupId}
                                onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                            >
                                <option value="">Không đăng vào nhóm (Công khai)</option>
                                {groups.map(g => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Nội dung</label>
                        <div className="quill-editor-wrapper">
                            <ReactQuill
                                theme="snow"
                                value={formData.content}
                                onChange={(content) => setFormData({ ...formData, content })}
                                modules={modules}
                                formats={formats}
                                placeholder="Viết nội dung của bài viết tại đây..."
                            />
                        </div>
                    </div>

                    <button
                        className="auth-btn"
                        type="submit"
                        disabled={isAnalyzing}
                        style={{ opacity: isAnalyzing ? 0.7 : 1, cursor: isAnalyzing ? 'not-allowed' : 'pointer' }}
                    >
                        {isAnalyzing ? 'Đang phân tích ảnh...' : (isEditMode ? 'Cập nhật bài viết' : 'Gửi bài viết')}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="nav-logout-btn submit-new-post-btn"
                        style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}
                    >
                        Hủy
                    </button>
                </form>
            </motion.div>
        </div >
    );
};

export default CreatePost;



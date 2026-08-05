import { useState } from 'react';
import { useNavigate } from '@/next-compat';
import magazineService from '../services/magazineService';
import { motion } from 'framer-motion';
import { containsBadWords } from '../utils/wordFilter';
import { useEffect } from 'react';
import MagazineOnboardBanner from './MagazineOnboardBanner';
import { useAuth } from '../context/AuthContext';

const CreateMagazine = () => {
    const { isAdmin } = useAuth();

    useEffect(() => {
        document.title = 'Xuất bản Tạp chí của bạn | BlogSocial';
    }, []);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [magazineData, setMagazineData] = useState({
        magazineName: '',
        imageFile: null,
        idempotencyKey: typeof window !== 'undefined' ? crypto.randomUUID() : ''
    });

    const [pages, setPages] = useState([]);

    const handleAddPage = () => {
        if (pages.length >= 10) {
            setError('Mỗi tạp chí chỉ được tạo tối đa 10 trang.');
            return;
        }
        setPages([...pages, {
            id: Date.now(),
            pageTitle: '',
            headlineImageUrl: '' || 'https://blogsocial.io.vn/bg.jpg',
            imageFile: null,
            firstParagraph: '',
            secondParagraph: '',
            thirdParagraph: '',
            fourthParagraph: '',
            idempotencyKey: crypto.randomUUID()
        }]);
    };

    const handleRemovePage = (indexId) => {
        setPages(pages.filter(p => p.id !== indexId));
    };

    const handlePageChange = (id, field, value) => {
        setPages(pages.map(page => {
            if (page.id === id) {
                return { ...page, [field]: value };
            }
            return page;
        }));
    };

    const handleMagazineFileChange = (e) => {
        const file = e.target.files[0];
        if (file) setMagazineData({ ...magazineData, imageFile: file });
    };

    const handlePageFileChange = (id, e) => {
        const file = e.target.files[0];
        if (file) {
            handlePageChange(id, 'imageFile', file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Bad words check
        if (!isAdmin && containsBadWords(magazineData.magazineName)) {
            setError('Tên tạp chí không được chứa từ ngữ không phù hợp.');
            setLoading(false);
            return;
        }

        for (const page of pages) {
            const fieldsToCheck = [
                page.pageTitle,
                page.firstParagraph,
                page.secondParagraph,
                page.thirdParagraph,
                page.fourthParagraph
            ];

            for (const field of fieldsToCheck) {
                if (!isAdmin && field && containsBadWords(field)) {
                    setError(`Nội dung trang ${pages.indexOf(page) + 1} chứa từ ngữ không phù hợp.`);
                    setLoading(false);
                    return;
                }
            }
        }

        try {
            // Create Magazine
            const formData = new FormData();
            formData.append('magazineName', magazineData.magazineName);
            if (magazineData.imageFile) formData.append('imageFile', magazineData.imageFile);

            const magResponse = await magazineService.createMagazine(formData, magazineData.idempotencyKey);
            const magazineId = magResponse.data.id || magResponse.data.Id;

            // Add Pages sequentially
            for (let i = 0; i < pages.length; i++) {
                const pageNum = i + 1;
                const p = pages[i];
                const pageFormData = new FormData();
                pageFormData.append('pageTitle', p.pageTitle);
                pageFormData.append('firstParagraph', p.firstParagraph);
                if (p.secondParagraph) pageFormData.append('secondParagraph', p.secondParagraph);
                if (p.thirdParagraph) pageFormData.append('thirdParagraph', p.thirdParagraph);
                if (p.fourthParagraph) pageFormData.append('fourthParagraph', p.fourthParagraph);
                pageFormData.append('pageNumber', pageNum);
                pageFormData.append('headlineImageUrl', p.headlineImageUrl || 'https://blogsocial.io.vn/bg.jpg'); // Fallback URL
                if (p.imageFile) pageFormData.append('imageFile', p.imageFile);

                await magazineService.addPage(magazineId, pageFormData, p.idempotencyKey);
            }

            navigate(`/magazine`);
        } catch (err) {
            let serverMessage = 'Có lỗi xảy ra khi xuất bản tạp chí.';
            const data = err.response?.data;
            if (data) {
                if (data.errors && typeof data.errors === 'object') {
                    const errorMessages = [];
                    for (const key in data.errors) {
                        if (Array.isArray(data.errors[key])) {
                            errorMessages.push(data.errors[key].join(', '));
                        }
                    }
                    serverMessage = errorMessages.join(' | ');
                } else if (typeof data === 'string') {
                    serverMessage = data;
                } else if (data.message) {
                    serverMessage = data.message;
                } else if (data.title) {
                    serverMessage = data.title + (data.detail ? ': ' + data.detail : '');
                } else {
                    serverMessage = 'Có lỗi từ máy chủ. Vui lòng thử lại.';
                }
            }
            setError(serverMessage);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ maxWidth: '1200px' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="auth-card" style={{ maxWidth: 'none' }}>
                <h1 className="auth-title">Xuất bản Tạp Chí</h1>
                <MagazineOnboardBanner />
                {error && <div className="error-msg" style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Tên Tạp Chí</label>
                        <input
                            className="form-input"
                            type="text"
                            value={magazineData.magazineName}
                            onChange={(e) => setMagazineData({ ...magazineData, magazineName: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Ảnh bìa Tạp Chí</label>
                        <input
                            className="form-input"
                            type="file"
                            accept="image/*"
                            onChange={handleMagazineFileChange}
                            required
                        />
                    </div>

                    <hr style={{ margin: '2rem 0', borderColor: 'var(--border)' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Các trang:</h2>
                        <button type="button" onClick={handleAddPage} className="auth-btn" style={{ width: 'auto', padding: '0.5rem 1rem' }}>+ Thêm Trang</button>
                    </div>

                    {pages.map((page, index) => (
                        <div key={page.id} style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: '12px', marginTop: '1rem', background: 'var(--card-bg)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1.1rem' }}>Trang {index + 1}</h3>
                                <button type="button" onClick={() => handleRemovePage(page.id)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>Xóa trang</button>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Tiêu đề trang</label>
                                <input className="form-input" type="text" value={page.pageTitle} onChange={(e) => handlePageChange(page.id, 'pageTitle', e.target.value)} required />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Ảnh trang (Headline)</label>
                                <input className="form-input" type="file" accept="image/*" onChange={(e) => handlePageFileChange(page.id, e)} />
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>* Để trống nếu muốn lấy ảnh bìa tạp chí làm hình nền cho trang này.</p>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Đoạn văn 1 (Bắt buộc)</label>
                                <textarea className="form-input" rows={3} value={page.firstParagraph} onChange={(e) => handlePageChange(page.id, 'firstParagraph', e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Đoạn văn 2</label>
                                <textarea className="form-input" rows={3} value={page.secondParagraph} onChange={(e) => handlePageChange(page.id, 'secondParagraph', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Đoạn văn 3</label>
                                <textarea className="form-input" rows={3} value={page.thirdParagraph} onChange={(e) => handlePageChange(page.id, 'thirdParagraph', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Đoạn văn 4</label>
                                <textarea className="form-input" rows={3} value={page.fourthParagraph} onChange={(e) => handlePageChange(page.id, 'fourthParagraph', e.target.value)} />
                            </div>
                        </div>
                    ))}

                    <button
                        className="auth-btn"
                        type="submit"
                        disabled={loading}
                        style={{ marginTop: '2rem', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                    >
                        {loading ? 'Đang xuất bản...' : 'Công bố Tạp Chí'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default CreateMagazine;



import { useState, useEffect } from 'react';
import { Link } from '@/next-compat';
import magazineService from '../services/magazineService';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Trash2 } from 'lucide-react';

const MagazineList = () => {
    const [magazines, setMagazines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const { user, isAdmin } = useAuth();

    useEffect(() => {
        const fetchMagazines = async () => {
            try {
                const response = await magazineService.getMagazines(1, 20);
                const data = response.data.magazines || response.data;
                setMagazines(Array.isArray(data) ? data : []);
            } catch (err) {
                setError('Không thể lấy danh sách tạp chí.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchMagazines();
    }, []);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
        ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '')
        : 'http://localhost:5001';

    const handleDelete = async (id) => {
        setDeleting(true);
        try {
            await magazineService.deleteMagazine(id);
            setMagazines(prev => prev.filter(m => m.id !== id));
            setDeleteId(null);
        } catch (err) {
            console.error(err);
            alert('Không thể xóa tạp chí. Vui lòng thử lại.');
        } finally {
            setDeleting(false);
        }
    };

    if (loading) return <div className="maybe-is-birthday-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải danh sách tạp chí...</div>;
    if (error) return <div className="error-msg" style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>{error}</div>;

    return (
        <div style={{ padding: '1rem 0' }}>
            {magazines.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', background: 'var(--card-bg)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
                    Chưa có tạp chí nào trên hệ thống. Hãy là người đầu tiên tạo!
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    <AnimatePresence>
                        {magazines.map((mag, index) => {
                            const bgImage = mag.coverImage && mag.coverImage !== ''
                                ? (mag.coverImage.startsWith('http') ? mag.coverImage : `${API_BASE_URL}${mag.coverImage}`)
                                : 'https://blogsocial.io.vn/bg.jpg';

                            return (
                                <motion.div
                                    key={mag.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.05 }}
                                    style={{
                                        border: '1px solid var(--border)',
                                        borderRadius: '16px',
                                        overflow: 'hidden',
                                        background: 'var(--card-bg)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                        position: 'relative'
                                    }}
                                >
                                    <Link to={`/magazine/${mag.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <div style={{ height: '180px', width: '100%', overflow: 'hidden' }}>
                                            <img
                                                src={bgImage}
                                                alt={mag.magazineName}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                                            />
                                        </div>
                                        <div style={{ padding: '1.25rem' }}>
                                            <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem', margin: 0, color: 'var(--text-main)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {mag.magazineName}
                                            </h2>
                                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0, marginTop: '0.5rem' }}>
                                                Tác giả: {mag.authorName || 'Ẩn danh'}
                                            </p>
                                        </div>
                                    </Link>

                                    {/* Admin Delete Button */}
                                    {isAdmin && (
                                        <div style={{ padding: '0 1.25rem 1rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setDeleteId(mag.id);
                                                }}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                    padding: '0.4rem 0.75rem', borderRadius: '6px',
                                                    border: '1px solid rgba(220, 38, 38, 0.2)',
                                                    background: 'transparent', color: '#dc2626',
                                                    cursor: 'pointer', fontSize: '0.75rem',
                                                    transition: 'all 0.2s', width: '100%', justifyContent: 'center'
                                                }}
                                                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)'; }}
                                                onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                            >
                                                <Trash2 size={14} /> Gỡ bỏ tạp chí
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 10000, backdropFilter: 'blur(4px)'
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                            background: 'var(--card-dark)', border: '1px solid var(--border)',
                            borderRadius: '1rem', padding: '2rem', maxWidth: '400px', width: '90%',
                            textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
                        }}
                    >
                        <Trash2 size={40} style={{ color: '#dc2626', marginBottom: '1rem' }} />
                        <h3 style={{ marginBottom: '0.75rem', color: 'var(--text-main)' }}>Xác nhận xóa tạp chí</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            Bạn có chắc chắn muốn xóa tạp chí "<strong>{magazines.find(m => m.id === deleteId)?.magazineName}</strong>"?
                            Hành động này không thể hoàn tác.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <button
                                onClick={() => setDeleteId(null)}
                                disabled={deleting}
                                style={{
                                    padding: '0.6rem 1.5rem', borderRadius: '9999px',
                                    border: '1px solid var(--border)', background: 'var(--card-dark)',
                                    color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.85rem'
                                }}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => handleDelete(deleteId)}
                                disabled={deleting}
                                style={{
                                    padding: '0.6rem 1.5rem', borderRadius: '9999px',
                                    border: 'none', background: '#dc2626',
                                    color: 'white', cursor: deleting ? 'not-allowed' : 'pointer',
                                    fontSize: '0.85rem', opacity: deleting ? 0.7 : 1
                                }}
                            >
                                {deleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default MagazineList;

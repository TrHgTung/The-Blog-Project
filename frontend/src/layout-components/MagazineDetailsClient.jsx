'use client';
import { useState, useEffect, useRef, forwardRef, useCallback } from 'react';
import { useParams, useNavigate } from '@/next-compat';
import magazineService from '../services/magazineService';
import { filterBadWords, containsBadWords } from '../utils/wordFilter';
import { useAuth } from '../context/AuthContext';
import { Edit3, Save, X, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

// Each page component for react-pageflip (must use forwardRef)
const MagazinePage = forwardRef(({ page, pageNumber, magazineCover, apiBaseUrl, isEditing, onPageChange, accentColor }, ref) => {
    const paragraphs = [
        page?.firstParagraph,
        page?.secondParagraph,
        page?.thirdParagraph,
        page?.fourthParagraph
    ].filter(p => p && p.trim() !== "");

    const paragraphFields = ['firstParagraph', 'secondParagraph', 'thirdParagraph', 'fourthParagraph'];

    return (
        <div className="magazine-flip-page" ref={ref}>
            <div className={`magazine-page-content magazine-paragraphs-grid paragraphs-count-${paragraphs.length}`}>
                {pageNumber % 2 === 0 && page?.pageTitle && (
                    <div className="magazine-page-title-top" style={{ color: accentColor, borderBottomColor: `${accentColor}20` }}>
                        {filterBadWords(page.pageTitle)}
                    </div>
                )}
                {paragraphs.map((p, i) => (
                    <div key={i} className="magazine-paragraph-box">
                        {filterBadWords(p)}
                    </div>
                ))}
            </div>
            <div className="magazine-page-number">{pageNumber}</div>
        </div>
    );
});
MagazinePage.displayName = 'MagazinePage';

// Empty page for padding odd-count magazines
const EmptyPage = forwardRef((props, ref) => {
    return (
        <div className="magazine-flip-page empty-flip-page" ref={ref}>
            <div className="magazine-page-content empty-content">
                <div className="paragraph-placeholder"></div>
                <div className="paragraph-placeholder"></div>
                <div className="paragraph-placeholder"></div>
                <div className="paragraph-placeholder"></div>
            </div>
        </div>
    );
});
EmptyPage.displayName = 'EmptyPage';

const MagazineDetails = ({ initialMagazine, slug: propSlug }) => {
    const params = useParams();
    const slug = propSlug || params?.slug;
    const navigate = useNavigate();
    const { user, isAdmin } = useAuth();
    const [magazine, setMagazine] = useState(initialMagazine);
    const [loading, setLoading] = useState(!initialMagazine);
    const [error, setError] = useState('');
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [FlipBookComponent, setFlipBookComponent] = useState(null);
    const flipBookRef = useRef(null);

    // Random accent color for titles
    const [accentColor, setAccentColor] = useState('#4f46e5');
    useEffect(() => {
        const premiumColors = [
            '#4f46e5', // Indigo
            '#059669', // Emerald
            '#dc2626', // Red
            '#7c3aed', // Violet
            '#2563eb', // Blue
            '#db2777', // Pink
            '#d97706', // Amber
            '#0891b2', // Cyan
        ];
        const randomColor = premiumColors[Math.floor(Math.random() * premiumColors.length)];
        setAccentColor(randomColor);
    }, []);

    // Editing states
    const [isEditing, setIsEditing] = useState(false);
    const [editedMagazineName, setEditedMagazineName] = useState('');
    const [editedPages, setEditedPages] = useState([]);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const isOwner = user && magazine && user.id === magazine.authorId;
    const canEdit = isOwner;
    const canDelete = isAdmin;

    // Dynamically import react-pageflip (client-only, avoids SSR issues)
    useEffect(() => {
        import('react-pageflip').then(mod => {
            setFlipBookComponent(() => mod.default);
        });
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (slug && (!magazine || magazine.slug !== slug)) {
            const fetchMagazine = async () => {
                try {
                    setLoading(true);
                    const response = await magazineService.getMagazineBySlug(slug);
                    setMagazine(response.data);
                } catch (err) {
                    setError('Không thể lấy dữ liệu tạp chí.');
                } finally {
                    setLoading(false);
                }
            };
            fetchMagazine();
        }
    }, [slug, magazine]);

    const onFlip = useCallback((e) => {
        setCurrentPageIndex(e.data);
    }, []);

    useEffect(() => {
        if (magazine && magazine.pages) {
            const pageTitle = magazine.pages[currentPageIndex]?.pageTitle || magazine.magazineName;
            document.title = `${pageTitle} | BlogSocial`;
        }
    }, [magazine, currentPageIndex]);

    // Initialize editing state
    const startEditing = () => {
        setEditedMagazineName(magazine.magazineName);
        setEditedPages(magazine.pages.map(p => ({ ...p })));
        setIsEditing(true);
        setSaveError('');
        setSaveSuccess('');
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setEditedMagazineName('');
        setEditedPages([]);
        setSaveError('');
    };

    const handlePageTextChange = (pageId, field, value) => {
        setEditedPages(prev => prev.map(p =>
            p.id === pageId ? { ...p, [field]: value } : p
        ));
    };

    const handleEditedTitleChange = (pageId, value) => {
        setEditedPages(prev => prev.map(p =>
            p.id === pageId ? { ...p, pageTitle: value } : p
        ));
    };

    const saveEdits = async () => {
        setSaving(true);
        setSaveError('');
        setSaveSuccess('');

        // Bad words check
        if (containsBadWords(editedMagazineName)) {
            setSaveError('Tên tạp chí không được chứa từ ngữ không phù hợp.');
            setSaving(false);
            return;
        }

        for (const page of editedPages) {
            const fields = [page.pageTitle, page.firstParagraph, page.secondParagraph, page.thirdParagraph, page.fourthParagraph];
            for (const f of fields) {
                if (f && containsBadWords(f)) {
                    setSaveError('Nội dung trang chứa từ ngữ không phù hợp.');
                    setSaving(false);
                    return;
                }
            }
        }

        try {
            // Update magazine name if changed
            if (editedMagazineName !== magazine.magazineName) {
                const magFormData = new FormData();
                magFormData.append('magazineName', editedMagazineName);
                if (magazine.coverImage) magFormData.append('coverImage', magazine.coverImage);
                await magazineService.updateMagazine(magazine.id, magFormData);
            }

            // Update each page's text content
            for (const editedPage of editedPages) {
                const originalPage = magazine.pages.find(p => p.id === editedPage.id);
                if (!originalPage) continue;

                const textChanged =
                    editedPage.pageTitle !== originalPage.pageTitle ||
                    editedPage.firstParagraph !== originalPage.firstParagraph ||
                    editedPage.secondParagraph !== originalPage.secondParagraph ||
                    editedPage.thirdParagraph !== originalPage.thirdParagraph ||
                    editedPage.fourthParagraph !== originalPage.fourthParagraph;

                if (textChanged) {
                    const pageFormData = new FormData();
                    pageFormData.append('pageTitle', editedPage.pageTitle);
                    pageFormData.append('firstParagraph', editedPage.firstParagraph || '');
                    pageFormData.append('secondParagraph', editedPage.secondParagraph || '');
                    pageFormData.append('thirdParagraph', editedPage.thirdParagraph || '');
                    pageFormData.append('fourthParagraph', editedPage.fourthParagraph || '');
                    pageFormData.append('pageNumber', editedPage.pageNumber);
                    pageFormData.append('headlineImageUrl', editedPage.headlineImageUrl || '');
                    await magazineService.updatePage(editedPage.id, pageFormData);
                }
            }

            // Refetch the magazine to get updated data
            const response = await magazineService.getMagazineBySlug(slug);
            setMagazine(response.data);
            setIsEditing(false);
            setSaveSuccess('Cập nhật tạp chí thành công!');
            setTimeout(() => setSaveSuccess(''), 3000);
        } catch (err) {
            console.error(err);
            setSaveError('Có lỗi xảy ra khi cập nhật tạp chí. Vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await magazineService.deleteMagazine(magazine.id);
            navigate('/magazine');
        } catch (err) {
            console.error(err);
            setSaveError('Không thể xóa tạp chí. Vui lòng thử lại.');
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    if (error && !loading) return <div className="container error-msg">{error || 'Không tìm thấy tạp chí.'}</div>;
    if (!magazine && !loading) return <div className="container error-msg">Không tìm thấy dữ liệu tạp chí.</div>;

    const pages = magazine?.pages || [];
    const totalPages = pages.length;

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
        ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '')
        : (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') : 'http://localhost:5001');

    const activePageImage = (magazine?.pages || [])[currentPageIndex]?.headlineImageUrl || magazine?.coverImage;
    const coverImageUrl = activePageImage ? (activePageImage.startsWith('http')
        ? activePageImage
        : `${API_BASE_URL}${activePageImage}`) : null;

    const handlePrev = () => {
        if (flipBookRef.current) {
            flipBookRef.current.pageFlip().flipPrev();
        }
    };

    const handleNext = () => {
        if (flipBookRef.current) {
            flipBookRef.current.pageFlip().flipNext();
        }
    };

    const displayMagazineName = magazine?.magazineName || 'Đang tải...';
    const currentPage = pages[currentPageIndex];

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isEditing) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isEditing]);

    return (
        <div className="container post-details-container magazine-master-container" style={{ margin: 0, padding: 0, width: '100%', maxWidth: 'unset', overflowX: 'hidden' }}>
            <style>
                {`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 8px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: rgba(255,255,255,0.02);
                        border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(255,255,255,0.1);
                        border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: rgba(255,255,255,0.2);
                    }
                    @keyframes skeleton-loading {
                        0% { background-position: 200% 0; }
                        100% { background-position: -200% 0; }
                    }
                    .banner-skeleton {
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%);
                        background-size: 200% 100%;
                        animation: skeleton-loading 1.5s infinite linear;
                    }
                `}
            </style>

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
                {isEditing ? (
                    <div style={{ position: 'absolute', textAlign: 'center', width: '80%', maxWidth: '800px' }}>
                        <input
                            type="text"
                            value={editedMagazineName}
                            onChange={(e) => setEditedMagazineName(e.target.value)}
                            style={{
                                fontSize: '2rem', fontWeight: '800', textAlign: 'center',
                                background: 'rgba(0,0,0,0.6)', color: 'white', border: '2px solid #4f46e5',
                                borderRadius: '0.75rem', padding: '0.75rem 1.5rem', width: '100%',
                                backdropFilter: 'blur(10px)', outline: 'none'
                            }}
                        />
                        {/* Current page title editor */}
                        {currentPage && (
                            <input
                                type="text"
                                value={currentPage.pageTitle || ''}
                                onChange={(e) => handleEditedTitleChange(currentPage.id, e.target.value)}
                                placeholder="Tiêu đề trang..."
                                style={{
                                    fontSize: '1rem', fontWeight: '500', textAlign: 'center',
                                    background: 'rgba(0,0,0,0.4)', color: 'white', border: '1px solid rgba(255,255,255,0.3)',
                                    borderRadius: '0.5rem', padding: '0.5rem 1rem', width: '100%',
                                    marginTop: '0.75rem', backdropFilter: 'blur(10px)', outline: 'none'
                                }}
                            />
                        )}
                    </div>
                ) : (
                    <>
                        <h1 className='master-post-title' style={{
                            fontSize: '2.5rem', fontWeight: '800', lineHeight: '1.2',
                            marginBottom: '1.5rem', textAlign: 'center',
                            color: 'white', maxWidth: '1200px'
                        }}>
                            {filterBadWords(currentPage?.pageTitle || displayMagazineName)}
                        </h1>
                        {/* <h2 className='magazine-author'>Tác giả: </h2> */}
                    </>
                )}
            </div>

            {/* Banner image */}
            <div
                className='image-post-as-banner-container'
                style={{
                    width: '100%',
                    height: '450px',
                    maxHeight: '450px',
                    overflow: 'hidden',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 0,
                    background: 'var(--bg-main)'
                }}
            >
                {loading || !coverImageUrl ? (
                    <div className="banner-skeleton" />
                ) : (
                    <img
                        className='image-post-as-banner'
                        src={coverImageUrl}
                        alt={magazine?.magazineName || ''}
                        style={{
                            width: '100%',
                            height: '100%',
                            display: 'block',
                            objectFit: 'cover'
                        }}
                    />
                )}
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    height: '150px',
                    background: 'linear-gradient(to top, var(--bg-main), transparent)',
                    zIndex: 1
                }}></div>
            </div>

            {/* FlipBook */}
            <div className="magazine-container" style={{ position: 'relative', zIndex: 2, width: '100%' }}>
                {/* Action toolbar */}
                {(canEdit || canDelete) && (
                    <div style={{
                        display: 'flex', justifyContent: 'center', gap: '0.75rem',
                        marginBottom: '1rem', flexWrap: 'wrap'
                    }}>
                        {canEdit && (
                            <button
                                onClick={startEditing}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.6rem 1.25rem', borderRadius: '9999px',
                                    border: '1px solid var(--border)', background: 'var(--card-dark)',
                                    color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.85rem',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.color = '#4f46e5'; }}
                                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-main)'; }}
                            >
                                <Edit3 size={16} /> Chỉnh sửa nội dung
                            </button>
                        )}
                        {canDelete && !isEditing && (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.6rem 1.25rem', borderRadius: '9999px',
                                    border: '1px solid rgba(220, 38, 38, 0.3)', background: 'var(--card-dark)',
                                    color: '#dc2626', cursor: 'pointer', fontSize: '0.85rem',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = 'white'; }}
                                onMouseOut={(e) => { e.currentTarget.style.background = 'var(--card-dark)'; e.currentTarget.style.color = '#dc2626'; }}
                            >
                                <Trash2 size={16} />Gỡ bỏ tạp chí này
                            </button>
                        )}
                    </div>
                )}

                {/* Save status messages */}
                {saveError && (
                    <div style={{ textAlign: 'center', color: '#dc2626', marginBottom: '1rem', fontSize: '0.9rem', padding: '0.75rem', background: 'rgba(220, 38, 38, 0.1)', borderRadius: '0.5rem' }}>
                        {saveError}
                    </div>
                )}
                {saveSuccess && (
                    <div style={{ textAlign: 'center', color: '#16a34a', marginBottom: '1rem', fontSize: '0.9rem', padding: '0.75rem', background: 'rgba(22, 163, 74, 0.1)', borderRadius: '0.5rem' }}>
                        {saveSuccess}
                    </div>
                )}

                {/* Edit Modal (Floating) */}
                {isEditing && (
                    <div style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 10001, backdropFilter: 'blur(10px)', padding: '1rem'
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            style={{
                                background: 'var(--card-dark)', border: '1px solid var(--border)',
                                borderRadius: '1.5rem', width: '100%', maxWidth: '900px',
                                maxHeight: '70vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                            }}
                        >
                            {/* Modal Header */}
                            <div style={{
                                padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                background: 'rgba(255,255,255,0.02)'
                            }}>
                                <div>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Chỉnh sửa Tạp chí</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>Thay đổi tiêu đề và nội dung các trang</p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button
                                        onClick={cancelEditing}
                                        style={{
                                            padding: '0.6rem 1.25rem', borderRadius: '9999px',
                                            border: '1px solid var(--border)', background: 'transparent',
                                            color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.9rem'
                                        }}
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        className='nav-register-btn upd-magazine-btn'
                                        onClick={saveEdits}
                                        disabled={saving}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                                            padding: '0.6rem 1.75rem', borderRadius: '9999px',
                                            border: 'none',
                                            cursor: saving ? 'not-allowed' : 'pointer',
                                            fontSize: '0.9rem', fontWeight: 600, opacity: saving ? 0.7 : 1
                                        }}
                                    >
                                        <Save size={18} /> {saving ? 'Đang lưu...' : 'Lưu'}
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }} className="custom-scrollbar">
                                {/* Magazine Name */}
                                <div style={{ marginBottom: '2.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, color: 'var(--primary)', fontSize: '0.9rem' }}>TIÊU ĐỀ TỔNG QUAN</label>
                                    <input
                                        type="text"
                                        value={editedMagazineName}
                                        onChange={(e) => setEditedMagazineName(e.target.value)}
                                        placeholder="Nhập tên tạp chí..."
                                        style={{
                                            width: '100%', padding: '1rem', borderRadius: '0.75rem',
                                            background: 'var(--bg-main)', border: '1px solid var(--border)',
                                            color: 'var(--text-main)', fontSize: '1.1rem', outline: 'none',
                                            transition: 'border-color 0.2s'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
                                        onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                                    />
                                </div>

                                {/* Pages Content */}
                                <div>
                                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', borderLeft: '4px solid var(--primary)', paddingLeft: '0.75rem' }}>NỘI DUNG CHI TIẾT CÁC TRANG</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                        {editedPages.map((page, idx) => (
                                            <div key={page.id} style={{
                                                padding: '1.5rem', background: 'rgba(255,255,255,0.03)',
                                                borderRadius: '1.25rem', border: '1px solid var(--border)'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                                                    <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem' }}>TRANG {idx + 1}</span>
                                                </div>

                                                <div style={{ marginBottom: '1.25rem' }}>
                                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tiêu đề trang</label>
                                                    <input
                                                        type="text"
                                                        value={page.pageTitle}
                                                        onChange={(e) => handleEditedTitleChange(page.id, e.target.value)}
                                                        style={{
                                                            width: '100%', padding: '0.75rem', borderRadius: '0.6rem',
                                                            background: 'var(--bg-main)', border: '1px solid var(--border)',
                                                            color: 'var(--text-main)', outline: 'none'
                                                        }}
                                                    />
                                                </div>

                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                                    gap: '1.25rem'
                                                }}>
                                                    {['firstParagraph', 'secondParagraph', 'thirdParagraph', 'fourthParagraph'].map((field, pIdx) => (
                                                        <div key={field}>
                                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Đoạn văn {pIdx + 1}</label>
                                                            <textarea
                                                                value={page[field] || ''}
                                                                onChange={(e) => handlePageTextChange(page.id, field, e.target.value)}
                                                                placeholder={`Nội dung đoạn văn ${pIdx + 1}...`}
                                                                style={{
                                                                    width: '100%', height: '110px', padding: '0.75rem', borderRadius: '0.6rem',
                                                                    background: 'var(--bg-main)', border: '1px solid var(--border)',
                                                                    color: 'var(--text-main)', fontSize: '0.9rem', resize: 'none', outline: 'none',
                                                                    lineHeight: '1.5', transition: 'border-color 0.2s'
                                                                }}
                                                                onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
                                                                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Delete confirmation modal */}
                {showDeleteConfirm && (
                    <div style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 10000, backdropFilter: 'blur(4px)'
                    }}>
                        <div style={{
                            background: 'var(--card-dark)', border: '1px solid var(--border)',
                            borderRadius: '1rem', padding: '2rem', maxWidth: '400px', width: '90%',
                            textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
                        }}>
                            <Trash2 size={40} style={{ color: '#dc2626', marginBottom: '1rem' }} />
                            <h3 style={{ marginBottom: '0.75rem', color: 'var(--text-main)' }}>Xác nhận xóa tạp chí</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                Bạn có chắc chắn muốn xóa tạp chí "<strong>{magazine?.magazineName}</strong>"? Hành động này không thể hoàn tác.
                            </p>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
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
                                    onClick={handleDelete}
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
                        </div>
                    </div>
                )}

                {/* Breadcrumb */}
                <div className='magazine-breadcrumb-container'>
                    <div className="magazine-breadcrumb-container__magazine-breadcrumb magazine-breadcrumb" style={{ marginTop: '1rem', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        <a href="/magazine" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Tạp chí</a> / {magazine?.magazineName} ({magazine?.authorName})
                    </div>
                </div>

                <div className="magazine-flipbook-wrapper">
                    {FlipBookComponent ? (
                        <FlipBookComponent
                            ref={flipBookRef}
                            width={550}
                            height={typeof window !== 'undefined' && window.innerWidth <= 768 ? 1300 : 700}
                            size="stretch"
                            minWidth={315}
                            maxWidth="100%"
                            minHeight={400}
                            maxHeight="100%"
                            showCover={false}
                            mobileScrollSupport={true}
                            onFlip={onFlip}
                            className="magazine-flipbook"
                            style={{}}
                            startPage={0}
                            drawShadow={true}
                            flippingTime={600}
                            usePortrait={true}
                            startZIndex={0}
                            autoSize={true}
                            maxShadowOpacity={0.4}
                            showPageCorners={true}
                            disableFlipByClick={false}
                        >
                            {(() => {
                                const pageElements = pages.map((page, index) => (
                                    <MagazinePage
                                        key={page.id || index}
                                        page={page}
                                        pageNumber={page.pageNumber}
                                        magazineCover={magazine.coverImage}
                                        apiBaseUrl={API_BASE_URL}
                                        isEditing={isEditing}
                                        onPageChange={handlePageTextChange}
                                        accentColor={accentColor}
                                    />
                                ));
                                if (totalPages % 2 !== 0) {
                                    pageElements.push(<EmptyPage key="empty-last" />);
                                }
                                return pageElements;
                            })()}
                        </FlipBookComponent>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                            Đang tải trình đọc tạp chí...
                        </div>
                    )}
                </div>

                {/* Navigation buttons */}
                <div className="magazine-nav-buttons">
                    <button
                        className="magazine-nav-btn magazine-nav-prev"
                        onClick={handlePrev}
                        aria-label="Trang trước"
                    >
                        ‹
                    </button>
                    <button
                        className="magazine-nav-btn magazine-nav-next"
                        onClick={handleNext}
                        aria-label="Trang sau"
                    >
                        ›
                    </button>
                </div>

                {/* Page indicator */}
                <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Trang {currentPageIndex + 1} / {totalPages}
                </div>
            </div>
        </div>
    );
};

export default MagazineDetails;

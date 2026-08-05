import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MagazineOnboardBanner = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const hasSeenOnboard = localStorage.getItem('magazine_onboard_shown');
        if (!hasSeenOnboard) {
            setIsVisible(true);
        }
    }, []);

    const handleDismiss = () => {
        localStorage.setItem('magazine_onboard_shown', 'true');
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem'
                }}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleDismiss}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'rgba(0, 0, 0, 0.7)',
                            backdropFilter: 'blur(4px)'
                        }}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        style={{
                            background: 'transparent',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            padding: '2rem',
                            borderRadius: '24px',
                            position: 'relative',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            maxWidth: '500px',
                            width: '100%',
                            zIndex: 1,
                            filter: 'brightness(1.5)'
                        }}
                    >
                        <button
                            onClick={handleDismiss}
                            style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                color: 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                        >
                            ✕
                        </button>

                        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                background: 'transparent',
                                borderRadius: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2rem',
                                margin: '0 auto 1.5rem',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '50%',
                                lineHeight: '0'
                            }}>
                                📖
                            </div>
                            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', background: 'linear-gradient(to right, #fff, #cbd5e1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Cá nhân hóa tạp chí của bạn
                            </h3>
                        </div>

                        <p style={{ margin: 0, fontSize: '1rem', opacity: 0.8, lineHeight: 1.6, textAlign: 'center' }}>
                            Giờ đây các nội dung, hình ảnh, ý tưởng của bạn sẽ được cá nhân hóa trên bố cục tạp chí.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '0.2rem' }}>Thiết kế và đăng tải hình ảnh</strong>
                                <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>Đặt tên bìa gợi lên cảm hứng và bắt đầu thiết kế riêng một ảnh bìa thật chất lượng cho tạp chí của mình nhé.</span>
                            </div>
                            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '0.2rem' }}>Soạn thảo đa trang</strong>
                                <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>Nhấn "+ Thêm Trang" để chia nội dung thành nhiều bài viết nhỏ.</span>
                            </div>
                            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '0.2rem' }}>Hiệu ứng thị sai mới</strong>
                                <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>Hiệu ứng lật trang ấn tương, khơi dậy trí sáng tạo của bạn</span>
                            </div>
                        </div>

                        <button
                            onClick={handleDismiss}
                            style={{
                                marginTop: '1rem',
                                background: 'var(--primary)',
                                color: 'white',
                                border: 'none',
                                padding: '1rem',
                                borderRadius: '14px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                                transition: 'all 0.2s'
                            }}
                        // onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        // onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            Bắt đầu ý tưởng
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default MagazineOnboardBanner;

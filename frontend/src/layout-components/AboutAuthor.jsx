'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Facebook, Youtube, Activity, TrendingUp, UserPlus, Clock } from 'lucide-react';

// Custom SVG icons for Pinterest, X (Twitter), WordPress
const PinterestIcon = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.618 0 12.017 0z" />
    </svg>
);

const XIcon = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

const WordpressIcon = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm.139 22.846a10.77 10.77 0 0 1-5.748-1.642l4.195-11.517 4.298 11.53c-8.636.002-2.745 1.629-2.745 1.629zm7.391-4.708l-2.617-7.65 2.457-6.284a10.8 10.8 0 0 1 2.766 7.15c0 2.47-.83 4.747-2.606 6.784zM12 1.154c5.99 0 10.846 4.856 10.846 10.846 0 1.251-.212 2.452-.601 3.575L17.7 3.518a6.388 6.388 0 0 0-1.846-.282c-.933 0-1.579.52-1.579 1.173 0 .546.333.999.666 1.492.433.64.933 1.492.933 2.704 0 1.838-1.465 4.316-2.264 6.342l-2.42-7.85 1.705-4.664a10.793 10.793 0 0 1 7.105-2.279zM1.154 12c0-2.316.732-4.462 1.974-6.223l5.056 13.88a10.81 10.81 0 0 1-7.03-7.657z" />
    </svg>
);
import { useState, useEffect } from 'react';

import api from '../services/api';

const StatCard = ({ icon: Icon, label, value, color, valueSize = '2.5rem' }) => (
    <motion.div
        whileHover={{ translateY: -5 }}
        style={{
            background: 'var(--bg-body)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.25rem',
            flex: 1,
            minWidth: '200px'
        }}
    >
        <div style={{
            background: `${color}20`,
            padding: '0.8rem',
            borderRadius: '10px',
            color: color,
            marginBottom: '0.5rem'
        }}>
            <Icon size={24} />
        </div>
        <span style={{ fontSize: valueSize, fontWeight: '800', color: 'var(--text-main)', lineHeight: 1 }}>{value}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500', marginTop: '0.25rem' }}>{label}</span>
    </motion.div>
);

const AboutAuthor = () => {
    const [stats, setStats] = useState({ loading: true, data: null, error: null });
    useEffect(() => {
        document.title = 'Về tác giả | BlogSocial';

        const fetchStats = async () => {
            try {
                setStats(prev => ({ ...prev, loading: true }));
                const res = await api.get('/checkpoint/dash');
                setStats({ loading: false, data: res.data, error: null });
            } catch (err) {
                setStats({ loading: false, data: null, error: err.message });
            }
        };

        fetchStats();
    }, []);

    return (
        <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem' }}>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                style={{
                    background: 'var(--bg-card)',
                    borderRadius: '16px',
                    padding: '3rem 2rem',
                    textAlign: 'center',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Background decorative elements */}
                <div style={{
                    position: 'absolute', top: -50, right: -50, width: 200, height: 200,
                    borderRadius: '50%', background: 'var(--primary)', opacity: 0.05, filter: 'blur(40px)'
                }} />
                <div style={{
                    position: 'absolute', bottom: -50, left: -50, width: 200, height: 200,
                    borderRadius: '50%', filter: 'blur(40px)'
                }} />

                <motion.img
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 100, delay: 0.2 }}
                    src="https://avatars.githubusercontent.com/u/89836403?v=4"
                    alt="Author"
                    style={{
                        width: '150px', height: '150px',
                        borderRadius: '50%', objectFit: 'cover',
                        border: '4px solid var(--primary)',
                        marginBottom: '1.5rem',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                        position: 'relative', zIndex: 1
                    }}
                />

                <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: '800', textAlign: 'center' }}
                >
                    Hoàng Tùng (TrHgTung)
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    style={{ color: 'var(--primary)', fontSize: '1.2rem', fontWeight: '300', marginBottom: '1.5rem' }}
                >
                    A Junior Backend Web Developer
                </motion.p>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    style={{
                        color: 'var(--text-muted)', lineHeight: '1.8',
                        maxWidth: '600px', margin: '0 auto 2rem', fontSize: '1.1rem'
                    }}
                >
                    Xin chào! Tôi là một lập trình viên đam mê với việc xây dựng các trang web.
                    Dự án BlogSocial này ban đầu được tạo ra với mục đích hỗ trợ tín hiệu tương tác với cộng đồng LC. Nhưng tôi muốn đây trở thành một nơi có thể chia sẻ những điều mới mẻ và thú vị hơn.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'nowrap' }}
                >
                    <a href="https://www.facebook.com/blogsocialvn/" target="_blank" rel="noopener noreferrer" title="Facebook" className="nav-link" style={{ background: 'var(--bg-body)', padding: '0.8rem', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', color: '#1877F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Facebook size={24} />
                    </a>
                    <a href="https://www.pinterest.com/blogsocialvn/" target="_blank" rel="noopener noreferrer" title="Pinterest" className="nav-link" style={{ background: 'var(--bg-body)', padding: '0.8rem', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', color: '#E60023', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PinterestIcon size={24} />
                    </a>
                    <a href="https://x.com/blogsocial_vn" target="_blank" rel="noopener noreferrer" title="X (Twitter)" className="nav-link" style={{ background: 'var(--bg-body)', padding: '0.8rem', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <XIcon size={24} />
                    </a>
                    <a href="https://www.youtube.com/@blogsocial_vn" target="_blank" rel="noopener noreferrer" title="YouTube" className="nav-link" style={{ background: 'var(--bg-body)', padding: '0.8rem', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', color: '#FF0000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Youtube size={24} />
                    </a>
                    <a href="https://blogsocialvn9.wordpress.com/blogsocial-vn/" target="_blank" rel="noopener noreferrer" title="WordPress Blog" className="nav-link" style={{ background: 'var(--bg-body)', padding: '0.8rem', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', color: '#21759B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <WordpressIcon size={24} />
                    </a>
                </motion.div>

            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                style={{
                    marginTop: '2rem',
                    padding: '2rem',
                    background: 'var(--bg-card)',
                    borderRadius: '16px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Ở BlogSocial, chúng ta có gì:</h3>
                </div>

                {stats.loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        >
                            <Clock size={32} color="var(--text-muted)" />
                        </motion.div>
                    </div>
                ) : stats.error ? (
                    <div style={{ padding: '1rem', background: '#fee2e2', color: '#dc2626', borderRadius: '8px' }}>
                        Lỗi: {stats.error}
                    </div>
                ) : (
                    <>
                        <div className='dash-container' style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '1.5rem',
                            marginBottom: '3rem'
                        }}>
                            <StatCard
                                icon={TrendingUp}
                                label="Tổng lượt truy cập"
                                value={
                                    <span className="stat-value">
                                        <span className='number'>{(stats.data?.totalVisitorsCnt ?? 0) + 1}</span>
                                        <span className="plus-sign">+</span>
                                    </span>
                                }
                                color="#10b981"
                            />
                            <StatCard
                                icon={Activity}
                                label="Lượt hôm nay"
                                value={
                                    <span className="stat-value">
                                        <span className='number'> {(stats.data?.todayNewUsersRegisteredCnt ?? 0) + 1}</span>
                                        <span className="plus-sign">+</span>
                                    </span>
                                }
                                color="#6366f1"
                            />
                            <StatCard
                                icon={UserPlus}
                                label="Thành viên mới"
                                value={
                                    <span className="stat-value">
                                        <span className='number'>{(stats.data?.todayNewUsersRegisteredCnt ?? 0) + 1}</span>
                                        <span className="plus-sign">+</span>
                                    </span>
                                }
                                color="#f59e0b"
                            />
                        </div>

                        {/*  */}
                    </>
                )}
            </motion.div>
            <style jsx global>{`
                .dash-container .number {
                    font-size: 5rem;
                }
                .dash-container .stat-value {
                    display: flex;
                    align-items: flex-start;
                    font-weight: 700;
                    line-height: 1;
                }

                .dash-container .plus-sign {
                    font-size: 2rem;  
                    margin-left: 4px;
                    position: relative;
                    top: 4px;  
                    opacity: 0.36;        
                }
            `}</style>
        </div>

    );
};

export default AboutAuthor;



'use client';
import { motion, useScroll, useTransform, useMotionValue, animate, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { useNavigate } from '@/next-compat';
import { BookOpen, Trophy, Users, MessageSquare, Sparkles, Rocket, ShieldCheck, Activity, TrendingUp, UserPlus, Clock, MapPin, Bell, Facebook, Youtube } from 'lucide-react';
import api from '../services/api';
import '../component-css/LandingPage.css';

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

const Counter = ({ value, duration = 2, startCounting = true }) => {
    const count = useMotionValue(0);
    const rounded = useTransform(count, latest => Math.round(latest).toLocaleString());

    useEffect(() => {
        if (startCounting) {
            const controls = animate(count, value, {
                duration,
                ease: "easeOut"
            });
            return controls.stop;
        }
    }, [count, value, duration, startCounting]);

    return <motion.span>{rounded}</motion.span>;
};

const StatCard = ({ icon: Icon, label, value, color, valueSize = '3rem' }) => (
    <motion.div
        whileHover={{ translateY: -5 }}
        style={{
            background: 'var(--bg-card)',
            padding: '2rem',
            borderRadius: '20px',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.25rem',
            flex: 1,
            minWidth: '280px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
            position: 'relative',
            overflow: 'hidden'
        }}
    >
        <div style={{
            background: `${color}15`,
            padding: '1rem',
            borderRadius: '16px',
            color: color,
            marginBottom: '1rem'
        }}>
            <Icon size={32} />
        </div>
        <span style={{ fontSize: valueSize, fontWeight: '800', color: 'var(--text-main)', lineHeight: 1 }}>{value}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: '500', marginTop: '0.5rem', textAlign: 'center' }}>{label}</span>
    </motion.div>
);

const LandingPage = () => {
    const navigate = useNavigate();
    const targetRef = useRef(null);
    const statsRef = useRef(null);
    const statsInView = useInView(statsRef, { once: true, margin: "-100px" });
    const [stats, setStats] = useState({ loading: true, data: null, error: null });
    const [activeShowcase, setActiveShowcase] = useState(0);
    const [showcasePaused, setShowcasePaused] = useState(false);

    const showcaseSlides = [
        {
            tag: 'Gắn kết',
            title: 'Định nghĩa lại trải nghiệm đọc',
            description: 'Các bài blog được chia sẻ rộng rãi, mọi người dễ dàng tương tác với nhau, tiếp nhận thông tin và hơn thế nữa',
            image: 'https://blogsocial.io.vn/bg.jpg',
            navigateTo: '/'
        },
        {
            tag: 'Thử thách',
            title: 'Các trò chơi tức thời cho bạn',
            description: 'Thử thách bản thân với các trò chơi giải trí thú vị, xả stress và phá vỡ kỷ lục của chính bạn!',
            image: 'https://blogsocial.io.vn/k2.png',
            navigateTo: '/game-center'
        }
    ];

    // Auto-slide carousel
    useEffect(() => {
        if (showcasePaused) return;
        const interval = setInterval(() => {
            setActiveShowcase(prev => (prev + 1) % showcaseSlides.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [showcasePaused, showcaseSlides.length]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/checkpoint/dash');
                setStats({ loading: false, data: res.data, error: null });
            } catch (err) {
                setStats({ loading: false, data: null, error: err.message });
            }
        };
        fetchStats();
    }, []);

    useEffect(() => {
        // 5-second delayed visitor check (runs only once per browser session/device)
        const visitorToken = localStorage.getItem('application_visitor_id');
        const alreadyCounted = sessionStorage.getItem('application_session_counted');

        if (!alreadyCounted) {
            const timer = setTimeout(() => {
                let currentId = visitorToken;
                if (!currentId) {
                    currentId = 'v_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                    localStorage.setItem('application_visitor_id', currentId);
                }

                api.post('/checkpoint/hit', { sessionId: currentId })
                    .then(() => {
                        sessionStorage.setItem('application_session_counted', 'true');
                    })
                    .catch(err => console.error('Failed to record visitor:', err));
            }, 5000); // 5 seconds delay

            return () => clearTimeout(timer);
        }
    }, []);

    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start start", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

    const features = [
        {
            icon: <Trophy className="feature-icon" />,
            title: "Trò chơi tức thời",
            description: "Thử thách bản thân với các trò chơi giải trí thú vị, xả stress và phá vỡ kỷ lục của chính bạn!"
        },
        {
            icon: <BookOpen className="feature-icon" />,
            title: "Trải Nghiệm Tạp Chí",
            description: "Đọc và xuất bản những câu chuyện của bạn với định dạng tạp chí lật trang độc đáo và chuyên nghiệp."
        },
        {
            icon: <Users className="feature-icon" />,
            title: "Cộng Đồng Gắn Kết",
            description: "Tham gia các hội nhóm, thảo luận và kết nối với những người cùng đam mê trên khắp thế giới."
        },
        {
            icon: <MessageSquare className="feature-icon" />,
            title: "Trò Chuyện Real-time",
            description: "Hệ thống tin nhắn tức thời giúp bạn giữ liên lạc với bạn bè và đồng nghiệp mọi lúc mọi nơi."
        },
        {
            icon: <MapPin className="feature-icon" />,
            title: "Tìm địa điểm ăn vặt",
            description: "Tìm kiếm địa điểm ăn vặt xung quanh bạn và chia sẻ với bạn bè."
        },
        {
            icon: <Bell className="feature-icon" />,
            title: "Nhận thông báo tức thì",
            description: "Nhận thông báo tức thì về các hoạt động của bạn bè và cộng đồng."
        }
    ];

    return (
        <div className="landing-container">
            {/* Hero Section with Parallax */}
            <section ref={targetRef} className="parallax-hero">
                <motion.div
                    style={{ y, opacity, scale }}
                    className="hero-content"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="hero-title">BlogSocial<br />Nơi Câu Chuyện Gắn Kết</h1>
                        <p className="hero-subtitle">
                            Khám phá nền tảng mạng xã hội thế hệ mới, nơi bạn có thể chia sẻ trải nghiệm,
                            xây dựng cộng đồng và kiến tạo những giá trị đích thực.
                        </p>
                        <button className="cta-button" onClick={() => navigate('/register')}>
                            Bắt đầu ngay hôm nay
                        </button>
                    </motion.div>
                </motion.div>
                <div className="hero-bg-accent" />
            </section>

            {/* Features Section */}
            <section className="landing-section">
                <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="section-title"
                >
                    Tại sao nên chọn BlogSocial?
                </motion.h2>
                <div className="features-grid">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="feature-card"
                        >
                            {feature.icon}
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Stats Dashboard Section */}
            <section className="landing-section" style={{ background: 'var(--bg-body-secondary)', borderRadius: '40px' }}>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{ textAlign: 'center', marginBottom: '4rem' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--primary)' }}>
                        <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0px', fontSize: '0.9rem' }}>Mọi người đang trở nên Social hơn</span>
                    </div>
                    <h2 style={{ fontSize: '3rem', fontWeight: 800 }}>Một cộng đồng nhỏ đang bùng nổ</h2>
                    <p style={{ color: 'var(--text-muted)', marginTop: '1rem', fontSize: '1.1rem' }}>Cùng xem những con số ấn tượng tại BlogSocial đến hiện tại</p>
                </motion.div>

                <div ref={statsRef} className="dash-container" style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '2rem',
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '0 1rem'
                }}>
                    {stats.loading ? (
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            >
                                <Clock size={48} color="var(--primary)" />
                            </motion.div>
                        </div>
                    ) : (
                        <>
                            <StatCard
                                icon={TrendingUp}
                                label="Tổng lượt truy cập"
                                value={
                                    <span className="stat-value">
                                        <span className="number">
                                            <Counter value={(stats.data?.totalVisitorsCnt ?? 0) + 1} startCounting={statsInView} />
                                        </span>
                                        <span className="plus-sign">+</span>
                                    </span>
                                }
                                color="#10b981"
                            />

                            <StatCard
                                icon={Activity}
                                label="Hoạt động hôm nay"
                                value={
                                    <span className="stat-value">
                                        <span className="number">
                                            <Counter value={(stats.data?.todayVisitorsCnt ?? 0) + 1} startCounting={statsInView} />
                                        </span>
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
                                        <span className="number">
                                            <Counter value={(stats.data?.todayNewUsersRegisteredCnt ?? 0) + 1} startCounting={statsInView} />
                                        </span>
                                        <span className="plus-sign">+</span>
                                    </span>
                                }
                                color="#f59e0b"
                            />

                            <StatCard
                                icon={Users}
                                label="Thành viên đã tham gia BlogSocial"
                                value={
                                    <span className="stat-value">
                                        <span className="number">
                                            <Counter value={(stats.data?.totalUsersCnt ?? 0) + 1} startCounting={statsInView} />
                                        </span>
                                        <span className="plus-sign">+</span>
                                    </span>
                                }
                                color="#10b981"
                            />
                        </>
                    )}
                </div>
            </section>

            {/* Showcase Carousel Section */}
            <section className="landing-section">
                <div className="showcase-section" style={{ flexDirection: 'column', position: 'relative' }}>
                    <motion.div
                        key={activeShowcase}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                        style={{ display: 'flex', alignItems: 'center', gap: '4rem', flexWrap: 'wrap', width: '100%' }}
                    >
                        <div className="showcase-content">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>
                                <Sparkles size={20} />
                                <span style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}>
                                    {showcaseSlides[activeShowcase].tag}
                                </span>
                            </div>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>
                                {showcaseSlides[activeShowcase].title}
                            </h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '2rem', lineHeight: '1.6' }}>
                                {showcaseSlides[activeShowcase].description}
                            </p>
                            <button
                                className="cta-button"
                                style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', boxShadow: 'none' }}
                                onClick={() => navigate(showcaseSlides[activeShowcase].navigateTo)}
                            >
                                Khám phá
                            </button>
                        </div>
                        <div className="showcase-image">
                            <img src={showcaseSlides[activeShowcase].image} alt={showcaseSlides[activeShowcase].title} />
                            <div style={{
                                position: 'absolute', inset: 0,
                                background: 'linear-gradient(45deg, rgba(79, 70, 229, 0.2), transparent)'
                            }} />
                        </div>
                    </motion.div>

                    {/* Carousel Dots & Progress */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '2.5rem' }}>
                        {showcaseSlides.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => { setActiveShowcase(i); setShowcasePaused(false); }}
                                style={{
                                    width: activeShowcase === i ? '2.5rem' : '0.65rem',
                                    height: '0.65rem',
                                    borderRadius: '999px',
                                    border: 'none',
                                    background: activeShowcase === i ? 'var(--primary)' : 'rgba(255,255,255,0.15)',
                                    cursor: 'pointer',
                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                    padding: 0
                                }}
                                aria-label={`Slide ${i + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <Rocket size={48} className="feature-icon" style={{ margin: '0 auto 2rem' }} />
                    <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1.5rem' }}>Sẵn sàng để tỏa sáng?</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
                        Tham gia cùng hàng ngàn người dùng khác và bắt đầu chia sẻ câu chuyện của bạn ngay hôm nay.
                        Nền tảng của chúng tôi hoàn toàn miễn phí.
                    </p>
                    <button className="cta-button" onClick={() => navigate('/register')}>
                        Tạo tài khoản miễn phí
                    </button>
                </motion.div>
                <div style={{ display: 'flex', gap: '1rem', margin: '2rem auto', justifyContent: 'center' }}>
                    <a href="/privacy-policy" rel='noopener' style={{ color: 'var(--text-muted)' }}>Chính sách bảo mật</a>
                    <a href="https://github.com/TrHgTung/The-Blog-Project" target='_blank' rel='nofollow noopener' style={{ color: 'var(--text-muted)' }}>Mã nguồn mở</a>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                    <a href="https://www.facebook.com/blogsocialvn/" target="_blank" rel="noopener noreferrer" title="Facebook" style={{ color: '#1877F2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', borderRadius: '10px', transition: 'opacity 0.2s' }}>
                        <Facebook size={22} />
                    </a>
                    <a href="https://www.pinterest.com/blogsocialvn/" target="_blank" rel="noopener noreferrer" title="Pinterest" style={{ color: '#E60023', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', borderRadius: '10px', transition: 'opacity 0.2s' }}>
                        <PinterestIcon size={22} />
                    </a>
                    <a href="https://x.com/blogsocial_vn" target="_blank" rel="noopener noreferrer" title="X (Twitter)" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', borderRadius: '10px', transition: 'opacity 0.2s' }}>
                        <XIcon size={22} />
                    </a>
                    <a href="https://www.youtube.com/@blogsocial_vn" target="_blank" rel="noopener noreferrer" title="YouTube" style={{ color: '#FF0000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', borderRadius: '10px', transition: 'opacity 0.2s' }}>
                        <Youtube size={22} />
                    </a>
                    <a href="https://blogsocialvn9.wordpress.com/blogsocial-vn/" target="_blank" rel="noopener noreferrer" title="WordPress Blog" style={{ color: '#21759B', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', borderRadius: '10px', transition: 'opacity 0.2s' }}>
                        <WordpressIcon size={22} />
                    </a>
                </div>
            </section>

            <style jsx global>{`
                .dash-container .number {
                    font-size: 5rem;
                }
                .dash-container .stat-value {
                    display: flex;
                    align-items: flex-start;
                    font-weight: 800;
                    line-height: 1;
                }
                .dash-container .plus-sign {
                    font-size: 1.8rem;
                    margin-left: 4px;
                    position: relative;
                    top: 6px;
                    color: var(--primary);
                }
                @media (max-width: 768px) {
                    .dash-container .number {
                        font-size: 3.5rem;
                    }
                    .dash-container .plus-sign {
                        font-size: 1.2rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default LandingPage;

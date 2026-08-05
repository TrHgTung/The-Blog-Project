'use client';
import React, { useEffect, useState } from 'react';
import { Trophy, Swords, Volleyball, Medal, Star, Crown } from 'lucide-react';
import scoreService from '../services/scoreService';

const games = [
    {
        title: 'Score Prediction Football',
        description: 'Dự đoán kết quả bóng đá (World Cup)',
        icon: Volleyball,
        iconColor: '#a6d2e4ff',
        path: '/world-cup',
        gradientFrom: '#6885cfff',
        gradientTo: '#5079c0ff',
        border: 'rgba(239, 68, 68, 0.4)',
        badges: ['Bóng đá', 'Giải trí'],
        popular: true,
        disabled: false
    },
    {
        title: 'Swipe Fruit Ninja',
        description: 'Vuốt màn hình để chém hoa quả tốc độ cao! Tuyệt đối tránh xa mìn 💣',
        icon: Swords,
        iconColor: '#ef4444',
        path: '/fruit-ninja',
        gradientFrom: '#450a0a',
        gradientTo: '#b91c1c',
        border: 'rgba(239, 68, 68, 0.4)',
        badges: ['Nhanh tay', 'Giải trí'],
        popular: true,
        disabled: false
    },
    {
        title: 'Emoji Pong Game',
        description: 'Thử thách phản xạ với AI siêu đỉnh, liệu bạn có thuộc top 0.01%?',
        icon: Trophy,
        iconColor: '#f59e0b',
        path: '/mini-game',
        gradientFrom: '#1e1b4b',
        gradientTo: '#4338ca',
        border: 'rgba(79, 70, 229, 0.4)',
        badges: ['Phản xạ', 'Trí tuệ nhân tạo'],
        popular: false,
        disabled: false
    }
];

const GameCenter = () => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [myCurrentRank, setMyCurrentRank] = useState(0);
    const [myTotalExp, setMyTotalExp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        document.title = 'Trung tâm trò chơi GamesHub | BlogSocial';
        const user = JSON.parse(localStorage.getItem('user'));
        setCurrentUser(user);
        fetchLeaderboard();
        if (user) {
            fetchCurrentUser_Rank();
            fetchCurrentUser_TotalExp();
        }
    }, []);

    const fetchCurrentUser_Rank = async () => {
        try {
            const data = await scoreService.getMyRank();
            setMyCurrentRank(data || 0);
        } catch (err) {
            console.error("Failed to fetch my current rank and total exp:", err);
        }
    }
    const fetchCurrentUser_TotalExp = async () => {
        try {
            const data = await scoreService.getMyScore();
            setMyTotalExp(data || null);
        } catch (err) {
            console.error("Failed to fetch my current rank and total exp:", err);
        }
    }

    const fetchLeaderboard = async () => {
        try {
            const data = await scoreService.getLeaderboard();
            setLeaderboard(data || []);
        } catch (err) {
            console.error("Failed to fetch leaderboard:", err);
        } finally {
            setLoading(false);
        }
    };

    const getRankIcon = (index) => {
        if (index === 0) return <Crown size={20} color="#fbbf24" />;
        if (index === 1) return <Medal size={20} color="#e2e8f0" />;
        if (index === 2) return <Medal size={20} color="#cd7f32" />;
        return <Star size={16} color="#475569" />;
    };

    return (
        <div style={{
            minHeight: 'calc(100vh - 80px)',
            color: 'white',
            fontFamily: "'Inter', sans-serif"
        }}>
            {/* Header & Hero */}
            <div style={{ padding: 'clamp(2rem, 8vw, 4rem) clamp(1rem, 4vw, 1.5rem) 2rem' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                            padding: '0.5rem 1.25rem', background: 'rgba(255,255,255,0.05)',
                            borderRadius: '2rem', border: '1px solid rgba(255,255,255,0.1)',
                            marginBottom: '1.5rem'
                        }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#c084fc', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                Trung tâm trò chơi
                            </span>
                        </div>

                        <h1 style={{
                            fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: '900', margin: '0 0 1rem',
                            background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            letterSpacing: '-0.02em', lineHeight: '1.2',
                            textAlign: 'center'
                        }}
                        className="h1-game-center-title"
                        >
                            Games<span style={{ color: '#ec4899', WebkitTextFillColor: 'initial', background: 'none' }}>Hub</span>
                        </h1>

                        <p style={{
                            textAlign: 'center', color: '#94a3b8', fontSize: '1.1rem', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6'
                        }}>
                            Khám phá bộ sưu tập trò chơi giải trí thú vị. Thử thách bản thân, xả stress và phá vỡ kỷ lục của chính bạn!
                        </p>
                    </div>

                    {/* Games Grid */}
                    <div className='games-grid' style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem', marginBottom: '5rem'
                    }}>
                        {games.map((game, i) => (
                            <div key={i} onClick={() => !game.disabled && (window.location.href = game.path)} style={{
                                position: 'relative',
                                background: `linear-gradient(145deg, ${game.gradientFrom}, ${game.gradientTo})`,
                                borderRadius: '1.5rem', padding: '2rem', cursor: game.disabled ? 'not-allowed' : 'pointer',
                                border: `1px solid ${game.border}`,
                                boxShadow: `0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)`,
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                opacity: game.disabled ? 0.7 : 1,
                                overflow: 'hidden'
                            }}
                                onMouseOver={e => !game.disabled && (e.currentTarget.style.transform = 'translateY(-8px)')}
                                onMouseOut={e => !game.disabled && (e.currentTarget.style.transform = 'translateY(0px)')}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', position: 'relative' }}>
                                    <div style={{
                                        width: '64px', height: '64px', borderRadius: '1rem',
                                        background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)'
                                    }}>
                                        <game.icon size={32} color={game.iconColor} />
                                    </div>
                                    {game.popular && (
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '0.25rem',
                                            background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                                            padding: '0.35rem 0.8rem', borderRadius: '2rem',
                                            fontSize: '0.75rem', fontWeight: '800', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                                            color: 'white'
                                        }}>
                                            HOT
                                        </div>
                                    )}
                                </div>

                                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 0.75rem' }}>{game.title}</h3>
                                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>{game.description}</p>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {game.badges.map((badge, j) => (
                                        <span key={j} style={{
                                            background: 'rgba(0,0,0,0.3)', padding: '0.3rem 0.7rem',
                                            borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: '600'
                                        }}>{badge}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Leaderboard Section */}
                    <div style={{
                        background: '#0c2a1d6b', borderRadius: '2rem', padding: 'clamp(1.25rem, 4vw, 3rem) clamp(0.75rem, 3vw, 2rem)',
                        border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 25px 50px rgba(0,0,0,0.2)',
                        overflow: 'hidden'
                    }}
                    className="leaderboard-container"
                    >
                        <div style={{ marginBottom: '2.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <h2 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: '900', margin: 0 }}>Bảng xếp hạng</h2>
                            </div>
                            <p style={{ color: '#94a3b8', fontSize: 'clamp(0.85rem, 2.5vw, 1rem)', margin: 0 }}>
                                Top 5 game thủ có điểm kinh nghiệm (Exp) cao nhất trên hệ thống GamesHub | BlogSocial.
                            </p>
                        </div>

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Đang tải bảng xếp hạng...</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {leaderboard.length > 0 ? leaderboard.map((entry, index) => (
                                    <div key={index} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: 'clamp(0.6rem, 2vw, 1rem) clamp(0.5rem, 2vw, 1.5rem)',
                                        background: index < 3 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.03)',
                                        borderRadius: '1.25rem', border: index < 3 ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent',
                                        transition: 'transform 0.2s', gap: '0.5rem',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(0.4rem, 2vw, 1rem)', minWidth: 0, flex: 1 }}>
                                            <div style={{
                                                width: 'clamp(28px, 4vw, 32px)', height: 'clamp(28px, 4vw, 32px)', 
                                                minWidth: 'clamp(28px, 4vw, 32px)', borderRadius: '50%',
                                                background: index < 3 ? 'rgba(164, 210, 26, 0.83)' : 'transparent',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: '800', color: index < 3 ? 'white' : '#475569',
                                                fontSize: '0.75rem', flexShrink: 0
                                            }}>
                                                {index + 1}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(0.25rem, 1.5vw, 1.25rem)', minWidth: 0 }}>
                                                <span style={{ flexShrink: 0, display: 'flex', transform: 'scale(clamp(0.8, 2vw, 1))' }}>{getRankIcon(index)}</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(0.5rem, 1.5vw, 1rem)', minWidth: 0 }}>
                                                    <img
                                                        src={entry.user?.profilePicture || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/cartoon/${entry.user?.cartoonCharacter || 1}.png`}
                                                        alt={entry.user?.displayName}
                                                        style={{ width: 'clamp(30px, 5vw, 36px)', height: 'clamp(30px, 5vw, 36px)', minWidth: 'clamp(30px, 5vw, 36px)', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}
                                                    />
                                                    <div style={{ minWidth: 0 }}>
                                                        <div style={{
                                                            fontWeight: '700', fontSize: 'clamp(0.85rem, 2.5vw, 1.1rem)',
                                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                            display: 'flex', alignItems: 'center', gap: '0.4rem'
                                                        }}>
                                                            {entry.user?.displayName || entry.user?.username || entry.userId?.substring(0, 8)}
                                                            {currentUser && (currentUser.id === entry.userId || currentUser._id === entry.userId) && (
                                                                <span style={{ fontSize: '0.75rem', color: '#ebed4c', fontWeight: '500' }}>(Bạn)</span>
                                                            )}
                                                        </div>
                                                        <div style={{ fontSize: 'min(0.7rem, 2.5vw)', color: '#64748b', whiteSpace: 'nowrap' }}>
                                                            Lần cuối chơi GamesHub: {new Date(entry.updatedAt).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <div style={{
                                                fontSize: 'clamp(1rem, 3vw, 1.4rem)', fontWeight: '900',
                                                color: index === 0 ? '#fbbf24' : '#f8fafc'
                                            }}>
                                                {entry.expPoint.toLocaleString()}
                                            </div>
                                            <div style={{ fontSize: 'clamp(0.6rem, 2vw, 0.65rem)', color: '#64748b', fontWeight: '600' }}>EXP</div>
                                        </div>
                                    </div>
                                )) : (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '1rem' }}>
                                        Chưa có dữ liệu xếp hạng. Hãy là người đầu tiên chơi game!
                                    </div>
                                )}
                            </div>
                        )}
                        {currentUser && (
                            <div style={{
                                background: 'transparent', borderRadius: '1rem', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)', marginTop: '2rem'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700' }}>
                                           #{myCurrentRank}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '1rem', fontWeight: '700', color: '#f8fafc' }}>Vị trí của Bạn</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>({currentUser.displayName || currentUser.username || currentUser.name || '-'})</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1.5rem', textAlign: 'right' }}>
                                        <div>
                                            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#f8fafc' }}>{myTotalExp?.expPoint?.toLocaleString() || 0}</div>
                                            <div style={{ fontSize: '0.65rem', color: '#64748b' }}>EXP</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameCenter;

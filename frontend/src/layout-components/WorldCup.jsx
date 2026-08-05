'use client';
import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, Clock, ChevronRight, Send, History } from 'lucide-react';
import scoreService from '../services/scoreService';
import api from '../services/api';

const getFlag = (teamName) => {
    if (!teamName) return '🏳️';
    
    const name = teamName.trim();
    
    const flags = {
        'Mexico': '🇲🇽',
        'Nam Phi': '🇿🇦', 'South Africa': '🇿🇦',
        'Hàn Quốc': '🇰🇷', 'South Korea': '🇰🇷',
        'CH Czech': '🇨🇿', 'Czech Republic': '🇨🇿',
        'Canada': '🇨🇦',
        'Bosnia-Herzegovina': '🇧🇦', 'Bosnia and Herzegovina': '🇧🇦',
        'Brazil': '🇧🇷',
        'Argentina': '🇦🇷',
        'Đức': '🇩🇪', 'Germany': '🇩🇪',
        'Pháp': '🇫🇷', 'France': '🇫🇷',
        'Anh': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
        'Ý': '🇮🇹', 'Italy': '🇮🇹',
        'Nhật Bản': '🇯🇵', 'Japan': '🇯🇵',
        'Tây Ban Nha': '🇪🇸', 'Spain': '🇪🇸',
        'Bỉ': '🇧🇪', 'Belgium': '🇧🇪',
        'Bồ Đào Nha': '🇵🇹', 'Portugal': '🇵🇹',
        'Hà Lan': '🇳🇱', 'Netherlands': '🇳🇱',
        'Thụy Sĩ': '🇨🇭', 'Switzerland': '🇨🇭',
        'Áo': '🇦🇹', 'Austria': '🇦🇹',
        'Ba Lan': '🇵🇱', 'Poland': '🇵🇱',
        'Croatia': '🇭🇷',
        'Bulgaria': '🇧🇬',
        'Romania': '🇷🇴',
        'Hungary': '🇭🇺',
        'Serbia': '🇷🇸',
        'Slovakia': '🇸🇰',
        'Slovenia': '🇸🇮',
        'Ukraine': '🇺🇦',
        'Belarus': '🇧🇾',
        'Nga': '🇷🇺', 'Russia': '🇷🇺',
        'Thụy Điển': '🇸🇪', 'Sweden': '🇸🇪',
        'Na Uy': '🇳🇴', 'Norway': '🇳🇴',
        'Đan Mạch': '🇩🇰', 'Denmark': '🇩🇰',
        'Phần Lan': '🇫🇮', 'Finland': '🇫🇮',
        'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
        'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
        'Bắc Ireland': '🇬🇧', 'Northern Ireland': '🇬🇧',
        'Ireland': '🇮🇪',
        'Hy Lạp': '🇬🇷', 'Greece': '🇬🇷',
        'Thổ Nhĩ Kỳ': '🇹🇷', 'Turkey': '🇹🇷',
        'Uruguay': '🇺🇾',
        'Chile': '🇨🇱',
        'Colombia': '🇨🇴',
        'Peru': '🇵🇪',
        'Paraguay': '🇵🇾',
        'Ecuador': '🇪🇨',
        'Bolivia': '🇧🇴',
        'Venezuela': '🇻🇪',
        'Mỹ': '🇺🇸', 'USA': '🇺🇸', 'United States': '🇺🇸',
        'Costa Rica': '🇨🇷',
        'Panama': '🇵🇦',
        'Jamaica': '🇯🇲',
        'Honduras': '🇭🇳',
        'Guatemala': '🇬🇹',
        'El Salvador': '🇸🇻',
        'Việt Nam': '🇻🇳', 'Vietnam': '🇻🇳',
        'Trung Quốc': '🇨🇳', 'China': '🇨🇳',
        'Ấn Độ': '🇮🇳', 'India': '🇮🇳',
        'Indonesia': '🇮🇩',
        'Thái Lan': '🇹🇭', 'Thailand': '🇹🇭',
        'Malaysia': '🇲🇾',
        'Singapore': '🇸🇬',
        'Philippines': '🇵🇭',
        'Úc': '🇦🇺', 'Australia': '🇦🇺',
        'New Zealand': '🇳🇿',
        'Saudi Arabia': '🇸🇦',
        'Qatar': '🇶🇦',
        'UAE': '🇦🇪',
        'Iran': '🇮🇷',
        'Iraq': '🇮🇶',
        'Jordan': '🇯🇴',
        'Uzbekistan': '🇺🇿',
        'Ai Cập': '🇪🇬', 'Egypt': '🇪🇬',
        'Morocco': '🇲🇦',
        'Algeria': '🇩🇿',
        'Tunisia': '🇹🇳',
        'Nigeria': '🇳🇬',
        'Ghana': '🇬🇭',
        'Cameroon': '🇨🇲',
        'Senegal': '🇸🇳',
        'Ivory Coast': '🇨🇮',
        'Israel': '🇮🇱',
        'Georgia': '🇬🇪',
        'Armenia': '🇦🇲',
        'Kazakhstan': '🇰🇿'
    };

    const foundKey = Object.keys(flags).find(
        key => key.toLowerCase() === name.toLowerCase()
    );

    return foundKey ? flags[foundKey] : '🏳️';
};

const getMatchStatus = (dateStr, timeStr) => {
    try {
        const now = new Date();
        let matchDate;

        // Parse date: try "dd/MM/yyyy" format first
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            matchDate = new Date(
                parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])
            );
        } else {
            // Fallback: "yyyy-MM-dd" or other standard formats
            matchDate = new Date(dateStr);
        }

        // Parse time: "HH:mm"
        const timeParts = timeStr.replace(/\s/g, '').split(':');
        matchDate.setHours(parseInt(timeParts[0]), parseInt(timeParts[1] || 0), 0, 0);

        const diffMinutes = (now - matchDate) / (1000 * 60);

        if (diffMinutes < 0) return 'upcoming';    // Chưa bắt đầu
        if (diffMinutes <= 100) return 'live';      // Đang diễn ra (trong 100 phút)
        return 'finished';                          // Đã kết thúc
    } catch {
        return 'upcoming';
    }
};


const WorldCup = () => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [prediction, setPrediction] = useState(0); // 0: Draw, 1: Team1, 2: Team2
    const [showSuccess, setShowSuccess] = useState(false);
    const [showLoginPopup, setShowLoginPopup] = useState(false);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    const upcomingMatches = matches.filter(m => m.matchStatus !== 'finished');
    const finishedMatches = matches.filter(m => m.matchStatus === 'finished');

    useEffect(() => {
        document.title = 'Dự đoán kết quả bóng đá - World Cup 2026 | BlogSocial';
        fetchMatches(0);
    }, []);

    const fetchMatches = async (currentOffset = 0, isLoadMore = false) => {
        if (isLoadMore) setIsFetchingMore(true);
        else setLoading(true);

        try {
            const limit = 10;
            const response = await api.get(`/FootballMatchData/prod?skip=${currentOffset}&take=${limit}`);
            const localPredictions = JSON.parse(localStorage.getItem('wc_predictions') || '{}');

            if (response.data.length < limit) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }

            const mappedMatches = response.data.map(m => {
                const status = getMatchStatus(m.date, m.time);
                return {
                    id: m.id,
                    homeTeam: m.team1,
                    awayTeam: m.team2,
                    homeFlag: getFlag(m.team1),
                    awayFlag: getFlag(m.team2),
                    time: m.time,
                    date: m.date,
                    stadium: 'BLOGSOCIAL',
                    predicted: localPredictions[m.id] !== undefined,
                    userPrediction: localPredictions[m.id],
                    isOccured: m.isOccured,
                    resultWinner: m.resultWinner,
                    matchStatus: status
                };
            });

            setMatches(prev => isLoadMore ? [...prev, ...mappedMatches] : mappedMatches);
            setOffset(currentOffset + response.data.length);

            await checkAndAwardPoints(mappedMatches, localPredictions);
        } catch (error) {
            console.error('Error fetching matches:', error);
        } finally {
            setLoading(false);
            setIsFetchingMore(false);
        }
    };

    const handleLoadMore = () => {
        fetchMatches(offset, true);
    };

    const checkAndAwardPoints = async (currentMatches, localPredictions) => {
        const awardedMatches = JSON.parse(localStorage.getItem('wc_awarded_matches') || '[]');
        let pointsToAdd = 0;
        const newlyProcessed = [];

        for (const match of currentMatches) {
            if (match.isOccured && localPredictions[match.id] !== undefined && !awardedMatches.includes(match.id)) {
                if (localPredictions[match.id] === match.resultWinner) {
                    pointsToAdd += 5;
                }
                newlyProcessed.push(match.id);
            }
        }

        if (newlyProcessed.length > 0) {
            const updatedAwards = [...awardedMatches, ...newlyProcessed];
            localStorage.setItem('wc_awarded_matches', JSON.stringify(updatedAwards));

            // Clear processed predictions from localPredictions
            const updatedPredictions = { ...localPredictions };
            newlyProcessed.forEach(id => {
                delete updatedPredictions[id];
            });
            localStorage.setItem('wc_predictions', JSON.stringify(updatedPredictions));

            if (pointsToAdd > 0) {
                const userString = localStorage.getItem('user');
                if (userString) {
                    try {
                        const user = JSON.parse(userString);
                        if (user && user.token) {
                            await scoreService.updateScore({ gameId: 'worldcup', score: pointsToAdd });
                        }
                    } catch (e) {
                        console.error('Tiến trình chưa được áp dụng. Có lỗi xảy ra khi cộng điểm:', e);
                    }
                }
            }
        }
    };

    const handlePredict = (match) => {
        if (match.isOccured) return;
        
        let isAuthenticated = false;
        const userString = localStorage.getItem('user');
        if (userString) {
            try {
                const user = JSON.parse(userString);
                if (user && user.token) isAuthenticated = true;
            } catch (e) {}
        }
        
        if (!isAuthenticated) {
            setShowLoginPopup(true);
            return;
        }

        setSelectedMatch(match);
        setPrediction(match.userPrediction !== undefined ? match.userPrediction : 1);
    };

    const submitPrediction = () => {
        const localPredictions = JSON.parse(localStorage.getItem('wc_predictions') || '{}');
        localPredictions[selectedMatch.id] = prediction;
        localStorage.setItem('wc_predictions', JSON.stringify(localPredictions));

        setMatches(prev => prev.map(m =>
            m.id === selectedMatch.id
                ? { ...m, predicted: true, userPrediction: prediction }
                : m
        ));

        setShowSuccess(true);
        setTimeout(() => {
            setShowSuccess(false);
            setSelectedMatch(null);
        }, 1500);
    };

    const getResultText = (winnerCode, homeTeam, awayTeam) => {
        if (winnerCode === 0) return 'Hòa';
        if (winnerCode === 1) return `${homeTeam} thắng`;
        if (winnerCode === 2) return `${awayTeam} thắng`;
        return 'Hòa';
    };

    return (
        <div style={{
            minHeight: 'calc(100vh - 80px)',
            color: 'white',
            fontFamily: "'Inter', sans-serif",
            padding: '2rem 1rem'
        }}>
            <div style={{ margin: '2rem auto', textAlign: 'center' }}>
                <button onClick={() => window.location.href = '/game-center'} style={{
                    background: 'rgba(255,165,0,0.1)', border: '1px solid orange',
                    color: 'orange', padding: '0.5rem 1rem', borderRadius: '0.75rem',
                    cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem'
                }}>
                    Quay lại Trung tâm trò chơi
                </button>
            </div>
            <div style={{ maxWidth: '800px', margin: '0 auto' }} className='world-cup-title-container'>
                <div style={{
                    textAlign: 'center',
                    marginBottom: '3rem',
                    background: '#000000ff',
                    padding: '3rem 0rem',
                    borderRadius: '2rem',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* <div style={{
                        position: 'absolute', top: '-10%', right: '-10%', width: '200px', height: '200px',
                        background: '#ffffff', filter: 'blur(100px)', opacity: 0.2
                    }} /> */}

                    <Trophy size={64} color="#fbbf24" style={{ marginBottom: '1.5rem', filter: 'drop-shadow(0 0 15px rgba(251,191,36,0.5))' }} />
                    <h1 className='h1-world-cup' style={{ fontSize: '2.5rem', fontWeight: '900', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
                        Dự đoán <span style={{ color: '#3b82f6' }}>bóng đá</span>
                    </h1>
                    <p className='desc-world-cup' style={{ color: '#94a3b8', fontSize: '1.1rem', textAlign: 'left' }}>
                        Dự đoán kết quả các trận đấu đỉnh cao để nhận ngay <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>5 EXP</span> cho mỗi lượt đoán đúng!
                    </p>
                </div>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Calendar size={20} color="#3b82f6" /> Danh sách trận đấu
                    </h2>
                    <small style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic', textAlign: 'left', marginTop: '-5px' }}>Cá cược là hành vi phạm pháp và bị nghiêm cấm tại Việt Nam.</small>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', background: '#1e293b', borderRadius: '1.5rem' }}>
                            <div style={{ marginBottom: '1rem' }}>Đang tải danh sách trận đấu...</div>
                            <div style={{ width: '40px', height: '40px', border: '4px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto', animation: 'spin 1s linear infinite' }}></div>
                        </div>
                    ) : matches.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', background: '#1e293b', borderRadius: '1.5rem' }}>
                            Không tìm thấy dữ liệu trận đấu.
                        </div>
                    ) : (
                        <>
                            {/* Upcoming / In-progress matches */}
                            {upcomingMatches.length > 0 && upcomingMatches.map(match => (
                                <div key={match.id} style={{
                                    background: '#1e293b',
                                    borderRadius: '1.5rem',
                                    padding: '1.5rem',
                                    border: match.predicted ? '2px solid #3b82f6' : match.matchStatus === 'live' ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                                    transition: 'transform 0.2s',
                                    cursor: match.matchStatus === 'live' ? 'default' : 'pointer',
                                    position: 'relative'
                                }}
                                    onClick={() => match.matchStatus !== 'live' && handlePredict(match)}
                                >
                                    {match.matchStatus === 'live' && (
                                        <div style={{
                                            position: 'absolute', top: '1rem', right: '1rem',
                                            background: '#10b981', padding: '0.25rem 0.5rem',
                                            borderRadius: '0.5rem', fontSize: '0.6rem', fontWeight: 'bold',
                                            color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem'
                                        }}>
                                            <span style={{
                                                width: '6px', height: '6px', borderRadius: '50%',
                                                background: 'white', display: 'inline-block',
                                                animation: 'pulse-dot 1.5s ease-in-out infinite'
                                            }} />
                                            ĐANG DIỄN RA
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '12px' }}>
                                            <Clock size={14} /> {match.date} • {match.time}
                                        </div>
                                        {match.matchStatus === 'upcoming' ? (
                                            <div style={{
                                                background: 'rgba(59,130,246,0.15)', padding: '0.25rem 0.5rem',
                                                borderRadius: '0.5rem', fontSize: '0.6rem', fontWeight: 'bold',
                                                color: '#3b82f6'
                                            }}>SẮP DIỄN RA - {match.stadium}</div>
                                        ) : (
                                            <div style={{ color: '#64748b' }}>{match.stadium}</div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                        <div style={{ flex: 1, textAlign: 'right' }}>
                                            <div style={{ fontSize: '1.8rem' }}>{match.homeFlag}</div>
                                            <div style={{ fontWeight: '800', marginTop: '0.25rem' }}>{match.homeTeam}</div>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1.25rem', borderRadius: '1rem', fontSize: '1.2rem', fontWeight: '800', color: '#64748b' }}>VS</div>
                                        <div style={{ flex: 1, textAlign: 'left' }}>
                                            <div style={{ fontSize: '1.8rem' }}>{match.awayFlag}</div>
                                            <div style={{ fontWeight: '800', marginTop: '0.25rem' }}>{match.awayTeam}</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                                        {match.predicted ? (
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                color: '#3b82f6', background: 'rgba(59,130,246,0.1)',
                                                padding: '0.5rem 1.5rem', borderRadius: '2rem', fontSize: '0.9rem', fontWeight: '700'
                                            }}>
                                                Dự đoán của bạn: {getResultText(match.userPrediction, match.homeTeam, match.awayTeam)}
                                            </div>
                                        ) : match.matchStatus === 'live' ? (
                                            <div style={{
                                                color: '#10b981', fontSize: '0.9rem', fontWeight: '600',
                                                fontStyle: 'italic'
                                            }}>
                                                Trận đấu đang diễn ra. Bạn không thể thay đổi dự đoán cho trận này
                                            </div>
                                        ) : (
                                            <button style={{
                                                background: '#3b82f6', color: 'white', border: 'none',
                                                padding: '0.75rem 2rem', borderRadius: '1rem', fontWeight: '700',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
                                            }}>
                                                Dự đoán ngay <ChevronRight size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Finished matches */}
                            {finishedMatches.length > 0 && (
                                <>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                                        marginTop: '1.5rem', marginBottom: '0.5rem'
                                    }}>
                                        <History size={18} color="#64748b" />
                                        <span className='skibidi-toilet-257' style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: '600' }}>Đã kết thúc</span>
                                    </div>

                                    {finishedMatches.map(match => (
                                        <div key={match.id} style={{
                                            background: '#0f172a',
                                            borderRadius: '1.5rem',
                                            padding: '1.5rem',
                                            border: match.predicted ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                                            opacity: 0.8,
                                            position: 'relative'
                                        }}>
                                            <div style={{
                                                position: 'absolute', top: '1rem', right: '1rem',
                                                background: '#334155', padding: '0.25rem 0.5rem',
                                                borderRadius: '0.5rem', fontSize: '0.6rem', fontWeight: 'bold'
                                            }}>
                                                ĐÃ KẾT THÚC
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '12px' }}>
                                                    <Clock size={14} /> {match.date} • {match.time}
                                                </div>
                                                <div style={{ color: '#64748b' }}>{match.stadium}</div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                                <div style={{ flex: 1, textAlign: 'right' }}>
                                                    <div style={{ fontSize: '1.8rem' }}>{match.homeFlag}</div>
                                                    <div style={{ fontWeight: '800', marginTop: '0.25rem' }}>{match.homeTeam}</div>
                                                </div>
                                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1.25rem', borderRadius: '1rem', fontSize: '1.2rem', fontWeight: '800', color: '#64748b' }}>VS</div>
                                                <div style={{ flex: 1, textAlign: 'left' }}>
                                                    <div style={{ fontSize: '1.8rem' }}>{match.awayFlag}</div>
                                                    <div style={{ fontWeight: '800', marginTop: '0.25rem' }}>{match.awayTeam}</div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Kết quả chung cuộc</div>
                                                    <div style={{ color: '#fbbf24', fontWeight: '800', fontSize: '1.2rem' }}>
                                                        {getResultText(match.resultWinner, match.homeTeam, match.awayTeam)}
                                                    </div>
                                                    {match.predicted && (
                                                        <div style={{
                                                            marginTop: '0.5rem',
                                                            color: match.userPrediction === match.resultWinner ? '#10b981' : '#ef4444',
                                                            fontSize: '0.9rem', fontWeight: 'bold'
                                                        }}>
                                                            {match.userPrediction === match.resultWinner ? 'Bạn đã đoán đúng!' : 'Bạn đoán sai rồi'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </>
                    )}

                    {hasMore && matches.length > 0 && (
                        <button
                            id='loadMoreBtnWcPredGame'
                            onClick={handleLoadMore}
                            disabled={isFetchingMore}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                background: '#1e293b',
                                border: '1px dashed #334155',
                                borderRadius: '1rem',
                                color: '#94a3b8',
                                cursor: isFetchingMore ? 'not-allowed' : 'pointer',
                                fontWeight: '600',
                                fontSize: '0.95rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.2s',
                                opacity: isFetchingMore ? 0.7 : 1,
                                marginTop: '1rem'
                            }}
                            onMouseEnter={e => { if (!isFetchingMore) { e.target.style.background = '#334155'; e.target.style.color = '#f8fafc'; } }}
                            onMouseLeave={e => { if (!isFetchingMore) { e.target.style.background = '#1e293b'; e.target.style.color = '#94a3b8'; } }}
                        >
                            {isFetchingMore ? (
                                <>
                                    <div style={{ width: '16px', height: '16px', border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                    Đang tải...
                                </>
                            ) : (
                                <>
                                    Tải thêm trận đấu
                                    <ChevronRight size={16} />
                                </>
                            )}
                        </button>
                    )}
                </div>

                {showLoginPopup && (
                    <div style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
                        padding: '1rem'
                    }}>
                        <div style={{
                            background: '#1e293b', padding: '2.5rem', borderRadius: '2rem',
                            maxWidth: '400px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
                            position: 'relative', textAlign: 'center'
                        }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem' }}>
                                Yêu cầu đăng nhập
                            </h3>
                            <p style={{ color: '#94a3b8', marginBottom: '2rem', fontSize: 'calc(1rem - 2px)' }}>
                                Bạn cần đăng nhập để tham gia dự đoán kết quả trận đấu.
                            </p>
                            
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={() => setShowLoginPopup(false)}
                                    style={{
                                        flex: 1, padding: '1rem', borderRadius: '1rem', border: 'none',
                                        background: '#334155', color: 'white', fontWeight: '700', cursor: 'pointer'
                                    }}
                                >Đóng</button>
                                <button
                                    onClick={() => window.location.href = '/login'}
                                    style={{
                                        flex: 1, padding: '1rem', borderRadius: '1rem', border: 'none',
                                        background: '#3b82f6', color: 'white', fontWeight: '700', cursor: 'pointer'
                                    }}
                                >Đăng nhập ngay</button>
                            </div>
                        </div>
                    </div>
                )}

                {selectedMatch && (
                    <div style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
                        padding: '1rem'
                    }}>
                        <div style={{
                            background: '#1e293b', padding: '2.5rem', borderRadius: '2rem',
                            maxWidth: '500px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
                            position: 'relative'
                        }}>
                            <h3 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: '800', marginBottom: '2rem' }}>
                                {selectedMatch.predicted ? 'Cập nhật dự đoán' : 'Đặt dự đoán'}
                            </h3>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '2.5rem' }}>
                                {[
                                    { value: 1, label: selectedMatch.homeTeam, sub: 'Thắng' },
                                    { value: 0, label: 'Hòa', sub: 'Draw' },
                                    { value: 2, label: selectedMatch.awayTeam, sub: 'Thắng' }
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setPrediction(opt.value)}
                                        style={{
                                            padding: '1rem 0.5rem',
                                            borderRadius: '1rem',
                                            border: prediction === opt.value ? '2px solid #3b82f6' : '1px solid #334155',
                                            background: prediction === opt.value ? 'rgba(59,130,246,0.1)' : '#0f172a',
                                            color: prediction === opt.value ? '#3b82f6' : '#94a3b8',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            textAlign: 'center'
                                        }}
                                    >
                                        <div style={{ fontWeight: '800', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{opt.label}</div>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>{opt.sub}</div>
                                    </button>
                                ))}
                            </div>

                            {showSuccess ? (
                                <div style={{
                                    background: '#10b981', color: 'white', padding: '1rem', borderRadius: '1rem',
                                    textAlign: 'center', fontWeight: '700'
                                }}>
                                    Đã lưu dự đoán thành công!
                                </div>
                            ) : (
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        onClick={() => setSelectedMatch(null)}
                                        style={{
                                            flex: 1, padding: '1rem', borderRadius: '1rem', border: 'none',
                                            background: '#334155', color: 'white', fontWeight: '700', cursor: 'pointer'
                                        }}
                                    >Hủy</button>
                                    <button
                                        onClick={submitPrediction}
                                        style={{
                                            flex: 2, padding: '1rem', borderRadius: '1rem', border: 'none',
                                            background: '#3b82f6', color: 'white', fontWeight: '700', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                        }}
                                    ><Send size={18} /> Gửi dự đoán</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <style jsx="true">{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes pulse-dot {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.4; transform: scale(1.5); }
                }
            `}</style>
        </div>
    );
};


export default WorldCup;

'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import '../component-css/MiniGame.css';
import ShareLink from '../components/ShareLink';
import scoreService from '../services/scoreService';

// ── Constants ────────────────────────────────────────────────────────────────
const W = 480;
const H = 640;
const PADDLE_W = 80;
const PADDLE_H = 14;
const BALL_SIZE = 28;
const PADDLE_SPEED = 6;
const AI_SPEED = 3.8;
const INITIAL_BALL_SPEED = 4.5;
const SPEED_INCREMENT = 0.18;
const WINNING_SCORE = 10;

const BALL_EMOJIS = ['🏀', '⚽', '🍎', '🌟', '💥'];
const PLAYER_EMOJIS = ['🐉', '🖐️', '🚀', '🍕', '🛸'];
const AI_EMOJIS = ['🤖', '👾', '😈', '🧠', '🐱'];
const BG_THEMES = [
    { bg: '#020617', mid: '#0f172a', accent: '#6366f1', name: 'Midnight' },
    { bg: '#0d1b2a', mid: '#1b2838', accent: '#00d2ff', name: 'Ocean' },
    { bg: '#1a0a2e', mid: '#16002e', accent: '#bf5af2', name: 'Galaxy' },
    { bg: '#0a1a0a', mid: '#0f2a0f', accent: '#34d399', name: 'Forest' },
    { bg: '#1a0a00', mid: '#2a1400', accent: '#fb923c', name: 'Ember' },
];

function drawRoundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// ── Main Component ───────────────────────────────────────────────────────────
const MiniGame = () => {
    const canvasRef = useRef(null);
    const stateRef = useRef(null);
    const rafRef = useRef(null);
    const keysRef = useRef({});
    const touchRef = useRef(null);

    const [score, setScore] = useState({ player: 0, ai: 0 });
    const [phase, setPhase] = useState('menu'); // menu | playing | paused | gameover
    const [winner, setWinner] = useState(null);
    const [isSavingScore, setIsSavingScore] = useState(false);
    const [ballEmoji, setBallEmoji] = useState('🏀');
    const [playerEmoji, setPlayerEmoji] = useState('🐉');
    const [aiEmoji, setAiEmoji] = useState('🤖');
    const [themeIdx, setThemeIdx] = useState(0);
    const theme = BG_THEMES[themeIdx];

    const initState = useCallback(() => {
        const angle = (Math.random() * Math.PI / 3) - Math.PI / 6;
        const dir = Math.random() > 0.5 ? 1 : -1;
        return {
            player: { x: W / 2 - PADDLE_W / 2, y: H - 50 },
            ai: { x: W / 2 - PADDLE_W / 2, y: 36 },
            ball: {
                x: W / 2,
                y: H / 2,
                vx: Math.cos(angle) * INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
                vy: Math.sin(angle) * INITIAL_BALL_SPEED * dir || INITIAL_BALL_SPEED * dir,
                speed: INITIAL_BALL_SPEED,
                spin: 0,
                trail: [],
            },
            score: { player: 0, ai: 0 },
            flash: null,
        };
    }, []);

    const startGame = useCallback(() => {
        stateRef.current = initState();
        setScore({ player: 0, ai: 0 });
        setWinner(null);
        setPhase('playing');
    }, [initState]);

    const handleGameOver = useCallback(async (winState, finalScore) => {
        setWinner(winState);
        setPhase('gameover');

        if (finalScore > 0) {
            setIsSavingScore(true);
            try {
                await scoreService.updateScore({ gameId: 'minigame', score: finalScore });
                const alertify = (await import('alertifyjs')).default;
                alertify.set('notifier', 'position', 'top-right');
                alertify.success(`🎉 Chúc mừng! Đã cộng +${finalScore} điểm vào tài khoản của bạn.`);
            } catch (error) {
                console.error("Failed to update score:", error);
                const alertify = (await import('alertifyjs')).default;
                alertify.error("Không thể lưu lại điểm số. Vui lòng kiểm tra lại kết nối.");
            } finally {
                setIsSavingScore(false);
            }
        }
    }, []);

    const resetBall = useCallback((scorer) => {
        const s = stateRef.current;
        const angle = (Math.random() * Math.PI / 4) - Math.PI / 8;
        const dir = scorer === 'player' ? -1 : 1;
        s.ball = {
            x: W / 2,
            y: H / 2,
            vx: Math.cos(angle) * INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
            vy: INITIAL_BALL_SPEED * dir,
            speed: INITIAL_BALL_SPEED,
            spin: 0,
            trail: [],
        };
    }, []);

    // ── Game Loop ─────────────────────────────────────────────────────────────
    useEffect(() => {
        document.title = 'Emoji Pong Game | BlogSocial';
    }, []);

    useEffect(() => {
        if (phase !== 'playing') {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const s = stateRef.current;

        const loop = () => {
            // ── Input ──────────────────────────────────────────────────────
            if (keysRef.current['ArrowLeft'] || keysRef.current['a'] || keysRef.current['A']) {
                s.player.x = Math.max(0, s.player.x - PADDLE_SPEED);
            }
            if (keysRef.current['ArrowRight'] || keysRef.current['d'] || keysRef.current['D']) {
                s.player.x = Math.min(W - PADDLE_W, s.player.x + PADDLE_SPEED);
            }
            if (touchRef.current !== null) {
                const tx = touchRef.current - PADDLE_W / 2;
                s.player.x = Math.max(0, Math.min(W - PADDLE_W, tx));
            }

            // ── AI ─────────────────────────────────────────────────────────
            const aiCenter = s.ai.x + PADDLE_W / 2;
            const diff = s.ball.x - aiCenter;
            const aiMove = Math.min(Math.abs(diff), AI_SPEED) * Math.sign(diff);
            s.ai.x = Math.max(0, Math.min(W - PADDLE_W, s.ai.x + aiMove));

            // ── Ball movement ──────────────────────────────────────────────
            const b = s.ball;
            b.trail.push({ x: b.x, y: b.y });
            if (b.trail.length > 10) b.trail.shift();

            b.x += b.vx;
            b.y += b.vy;

            // Wall bounce X
            if (b.x - BALL_SIZE / 2 < 0) { b.x = BALL_SIZE / 2; b.vx = Math.abs(b.vx); }
            if (b.x + BALL_SIZE / 2 > W) { b.x = W - BALL_SIZE / 2; b.vx = -Math.abs(b.vx); }

            // Player paddle collision
            const py = s.player.y;
            if (b.vy > 0 && b.y + BALL_SIZE / 2 >= py && b.y + BALL_SIZE / 2 <= py + PADDLE_H + 4
                && b.x >= s.player.x - 4 && b.x <= s.player.x + PADDLE_W + 4) {
                b.vy = -Math.abs(b.vy);
                b.speed = Math.min(b.speed + SPEED_INCREMENT, 12);
                const hit = (b.x - (s.player.x + PADDLE_W / 2)) / (PADDLE_W / 2);
                b.vx = hit * b.speed * 1.1;
                b.vy = -Math.sqrt(Math.max(b.speed * b.speed - b.vx * b.vx, 1));
                b.spin = hit * 2;
                s.flash = { x: b.x, y: py, color: '#6366f1', life: 8 };
            }

            // AI paddle collision
            const ay = s.ai.y + PADDLE_H;
            if (b.vy < 0 && b.y - BALL_SIZE / 2 <= ay && b.y - BALL_SIZE / 2 >= ay - PADDLE_H - 4
                && b.x >= s.ai.x - 4 && b.x <= s.ai.x + PADDLE_W + 4) {
                b.vy = Math.abs(b.vy);
                b.speed = Math.min(b.speed + SPEED_INCREMENT, 12);
                const hit = (b.x - (s.ai.x + PADDLE_W / 2)) / (PADDLE_W / 2);
                b.vx = hit * b.speed * 1.1;
                b.vy = Math.sqrt(Math.max(b.speed * b.speed - b.vx * b.vx, 1));
                s.flash = { x: b.x, y: ay, color: '#f43f5e', life: 8 };
            }

            // ── Scoring ────────────────────────────────────────────────────
            if (b.y > H + BALL_SIZE) {
                s.score.ai++;
                setScore({ ...s.score });
                if (s.score.ai >= WINNING_SCORE) {
                    handleGameOver('ai', s.score.player);
                    return;
                }
                resetBall('ai');
                s.flash = null;
            }
            if (b.y < -BALL_SIZE) {
                s.score.player++;
                setScore({ ...s.score });
                if (s.score.player >= WINNING_SCORE) {
                    handleGameOver('player', s.score.player);
                    return;
                }
                resetBall('player');
                s.flash = null;
            }

            if (s.flash) s.flash.life--;

            // ── Draw ───────────────────────────────────────────────────────
            ctx.clearRect(0, 0, W, H);

            // Background
            const grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, theme.bg);
            grad.addColorStop(1, theme.mid);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            // Center line dashes
            ctx.setLineDash([12, 10]);
            ctx.strokeStyle = 'rgba(255,255,255,0.07)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, H / 2);
            ctx.lineTo(W, H / 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // Flash effect
            if (s.flash && s.flash.life > 0) {
                const alpha = s.flash.life / 8 * 0.4;
                const r = (8 - s.flash.life) * 12;
                const fg = ctx.createRadialGradient(s.flash.x, s.flash.y, 0, s.flash.x, s.flash.y, r);
                fg.addColorStop(0, s.flash.color + Math.round(alpha * 255).toString(16).padStart(2, '0'));
                fg.addColorStop(1, 'transparent');
                ctx.fillStyle = fg;
                ctx.fillRect(0, 0, W, H);
            }

            // Ball trail
            b.trail.forEach((t, i) => {
                const a = (i / b.trail.length) * 0.25;
                ctx.globalAlpha = a;
                // Reset shadows for iOS
                ctx.shadowBlur = 0;
                ctx.shadowColor = 'transparent';
                
                ctx.font = `${BALL_SIZE * 0.6}px "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(ballEmoji, t.x, t.y);
            });
            ctx.globalAlpha = 1;

            // Ball
            // Reset shadows for iOS
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            ctx.font = `${BALL_SIZE}px "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.rotate(b.spin * 0.15);
            ctx.fillText(ballEmoji, 0, 0);
            ctx.restore();

            // AI paddle
            const aiGlow = ctx.createLinearGradient(s.ai.x, s.ai.y, s.ai.x + PADDLE_W, s.ai.y);
            aiGlow.addColorStop(0, '#f43f5e');
            aiGlow.addColorStop(0.5, '#fb7185');
            aiGlow.addColorStop(1, '#f43f5e');
            ctx.shadowColor = '#f43f5e';
            ctx.shadowBlur = 12;
            ctx.fillStyle = aiGlow;
            drawRoundRect(ctx, s.ai.x, s.ai.y, PADDLE_W, PADDLE_H, 7);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.font = `${PADDLE_H * 1.2}px "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif`;
            ctx.fillText(aiEmoji, s.ai.x + PADDLE_W / 2, s.ai.y + PADDLE_H / 2);

            // Player paddle
            const plGlow = ctx.createLinearGradient(s.player.x, s.player.y, s.player.x + PADDLE_W, s.player.y);
            plGlow.addColorStop(0, theme.accent);
            plGlow.addColorStop(0.5, '#a5b4fc');
            plGlow.addColorStop(1, theme.accent);
            ctx.shadowColor = theme.accent;
            ctx.shadowBlur = 14;
            ctx.fillStyle = plGlow;
            drawRoundRect(ctx, s.player.x, s.player.y, PADDLE_W, PADDLE_H, 7);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.font = `${PADDLE_H * 1.2}px "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif`;
            ctx.fillText(playerEmoji, s.player.x + PADDLE_W / 2, s.player.y + PADDLE_H / 2);

            rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [phase, ballEmoji, playerEmoji, aiEmoji, theme, resetBall, handleGameOver]);

    // ── Keyboard ──────────────────────────────────────────────────────────────
    useEffect(() => {
        const down = (e) => {
            keysRef.current[e.key] = true;
            if (e.key === ' ' || e.key === 'Escape') {
                if (phase === 'playing') setPhase('paused');
                else if (phase === 'paused') setPhase('playing');
            }
        };
        const up = (e) => { keysRef.current[e.key] = false; };
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
    }, [phase]);

    // ── Touch ─────────────────────────────────────────────────────────────────
    const handleTouchMove = (e) => {
        e.preventDefault();
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = W / rect.width;
        touchRef.current = (e.touches[0].clientX - rect.left) * scaleX;
    };
    const handleTouchEnd = () => { touchRef.current = null; };

    // ── Emoji Picker component ────────────────────────────────────────────────
    const EmojiPicker = ({ label, options, value, onChange }) => (
        <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {options.map(e => (
                    <button key={e} onClick={() => onChange(e)} style={{
                        fontSize: '1.4rem', background: value === e ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)',
                        border: value === e ? '1.5px solid #6366f1' : '1.5px solid transparent',
                        borderRadius: '0.5rem', padding: '4px 8px', cursor: 'pointer', transition: 'all 0.15s',
                        transform: value === e ? 'scale(1.15)' : 'scale(1)'
                    }}>{e}</button>
                ))}
            </div>
        </div>
    );

    // ── Overlay screens ───────────────────────────────────────────────────────
    const Overlay = ({ children }) => (
        <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '1rem',
            background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(8px)',
            padding: '2rem', zIndex: 10
        }}>
            {children}
        </div>
    );

    const BigBtn = ({ onClick, children, color = '#6366f1' }) => (
        <button onClick={onClick} style={{
            padding: '0.75rem 2.5rem', borderRadius: '1rem', border: 'none',
            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
            color: 'white', fontWeight: '700', fontSize: '1rem', cursor: 'pointer',
            boxShadow: `0 4px 24px ${color}55`,
            transition: 'transform 0.15s, box-shadow 0.15s',
        }}
            onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >{children}</button>
    );

    return (
        <div style={{
            minHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem',
            background: 'var(--bg-dark)', fontFamily: "'Inter', sans-serif"
        }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <h1 style={{
                    margin: 0, fontSize: '2rem', fontWeight: '900',
                    background: `linear-gradient(to right, ${theme.accent}, #a78bfa)`,
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    textAlign: 'center'
                }}>
                    Emoji Pong Game
                </h1>
                <p style={{ color: '#64748b', margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
                    Bên nào {WINNING_SCORE} điểm trước là chiến thắng • Di chuyển bằng phím mũi tên trái phải hoặc chạm vào màn hình
                </p>
            </div>

            {/* Score bar */}
            {phase !== 'menu' && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '1.5rem',
                    marginBottom: '0.75rem', background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1rem',
                    padding: '0.5rem 2rem'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem' }}>{aiEmoji}</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#f43f5e' }}>{score.ai}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>AI</div>
                    </div>
                    <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)' }} />
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem' }}>{playerEmoji}</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: '800', color: theme.accent }}>{score.player}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>YOU</div>
                    </div>
                </div>
            )}

            {/* Canvas */}
            <div className='overflow-cont' style={{
                position: 'relative', borderRadius: '1.25rem', overflow: 'hidden',
                boxShadow: `0 0 40px ${theme.accent}30, 0 20px 60px rgba(0,0,0,0.5)`,
                border: `1px solid ${theme.accent}33`
            }}>
                <canvas
                    ref={canvasRef}
                    width={W}
                    height={H}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    style={{ display: 'block', maxWidth: '100%', touchAction: 'none' }}
                />

                {/* Menu overlay */}
                {phase === 'menu' && (
                    <Overlay>
                        <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>Mini Game | BlogSocial</h2>
                        <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.85rem', textAlign: 'center', maxWidth: '260px' }}>
                            Liệu bạn có đánh bại được AI không? - Chỉ có 0.01% người chơi đánh bại được AI.
                        </p>

                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '320px' }}>
                            <EmojiPicker label="Emoji của bạn" options={PLAYER_EMOJIS} value={playerEmoji} onChange={setPlayerEmoji} />
                            <EmojiPicker label="Mục tiêu" options={BALL_EMOJIS} value={ballEmoji} onChange={setBallEmoji} />
                            <EmojiPicker label="Emoji của AI" options={AI_EMOJIS} value={aiEmoji} onChange={setAiEmoji} />

                            {/* Theme picker */}
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Chọn giao diện</div>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                    {BG_THEMES.map((t, i) => (
                                        <button key={i} onClick={() => setThemeIdx(i)} title={t.name} style={{
                                            width: '28px', height: '28px', borderRadius: '50%',
                                            background: t.accent, border: themeIdx === i ? '2.5px solid white' : '2.5px solid transparent',
                                            cursor: 'pointer', transform: themeIdx === i ? 'scale(1.2)' : 'scale(1)', transition: 'all 0.15s'
                                        }} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <BigBtn onClick={startGame} color={theme.accent}> Bắt đầu chơi</BigBtn>
                        <div style={{ marginTop: '0.5rem' }}>
                            <button onClick={() => window.location.href = '/game-center'} style={{
                                background: 'rgba(255,165,0,0.1)', border: '1px solid orange',
                                color: 'orange', padding: '0.5rem 1rem', borderRadius: '0.75rem',
                                cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem'
                            }}>
                                Quay lại Trung tâm trò chơi
                            </button>
                        </div>
                    </Overlay>
                )}

                {/* Pause overlay */}
                {phase === 'paused' && (
                    <Overlay>
                        <div style={{ fontSize: '3rem' }}>⏸️</div>
                        <h2 style={{ color: 'white', margin: 0 }}>Đang tạm dừng</h2>
                        <BigBtn onClick={() => setPhase('playing')} color={theme.accent}>Tiếp tục</BigBtn>
                        <BigBtn onClick={() => setPhase('menu')} color="#475569">Menu</BigBtn>
                    </Overlay>
                )}

                {/* Game over overlay */}
                {phase === 'gameover' && (
                    <Overlay>
                        <div style={{ fontSize: '4rem', lineHeight: 1, textShadow: '0 0 20px rgba(255, 215, 0, 0.5)' }}>
                            {winner === 'player' ? '🏆' : '💀'}
                        </div>
                        <h2 style={{
                            color: winner === 'player' ? '#fbbf24' : '#f43f5e',
                            margin: 0, fontSize: '1.8rem', fontWeight: '900'
                        }}>
                            {winner === 'player' ? 'Bạn đã thắng! 🎉' : 'AI đã thắng! 🤖'}
                        </h2>

                        {isSavingScore && (
                            <div style={{ color: '#34d399', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                🔄 Đang đồng bộ điểm số...
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem' }}>{aiEmoji}</div>
                                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#f43f5e' }}>{score.ai}</div>
                            </div>
                            <div style={{ color: '#64748b', fontSize: '1.5rem' }}>:</div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem' }}>{playerEmoji}</div>
                                <div style={{ fontSize: '2rem', fontWeight: '800', color: theme.accent }}>{score.player}</div>
                            </div>
                        </div>
                        <BigBtn onClick={startGame} color={theme.accent}>Chơi lại</BigBtn>
                        <BigBtn onClick={() => setPhase('menu')} color="#475569">Menu</BigBtn>
                    </Overlay>
                )}
            </div>

            {/* Controls hint */}
            {phase === 'playing' && (
                <div style={{ marginTop: '0.75rem', color: '#475569', fontSize: '0.75rem', display: 'flex', gap: '1rem' }}>
                    <span>← → để di chuyển</span>
                    <span>Space / Esc để tạm dừng</span>
                </div>
            )}
            <div style={{ marginTop: '0.75rem', color: '#475569', fontSize: '0.75rem', display: 'flex', gap: '1rem' }}>
                <span>Được phát triển bởi Antigravity AI Agent</span>
            </div>
            {/* Copy share link */}
            <ShareLink />
        </div>
    );
};

export default MiniGame;


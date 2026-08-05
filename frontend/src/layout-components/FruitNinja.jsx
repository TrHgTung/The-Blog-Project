'use client';
import React, { useEffect, useRef, useState } from 'react';
import { RefreshCcw, Play, ChevronLeft, Trophy, Zap, MousePointer2 } from 'lucide-react';
import '../component-css/MiniGame.css';
import scoreService from '../services/scoreService';

// ── Constants ────────────────────────────────────────────────────────────────
const W = 640;
const H = 480;
const FPS = 30;
const GRAVITY = 0.25;
const FRUIT_SIZE = 50;

const FRUITS = ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🥝', '🫐'];
const BOMBS = ['💣'];

const FruitNinja = () => {
    const canvasRef = useRef(null);

    const stateRef = useRef({
        fruits: [],
        score: 0,
        lives: 3,
        combo: 0,
        lastSliceTime: 0,
        particles: [],
        lastSpawn: 0,
        trail: [],
        isPointerDown: false
    });
    const rafRef = useRef(null);

    const [gameState, setGameState] = useState('menu'); // menu, playing, gameover
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);

    useEffect(() => {
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    const startGame = () => {
        stateRef.current = {
            fruits: [],
            score: 0,
            lives: 3,
            combo: 0,
            lastSliceTime: 0,
            particles: [],
            lastSpawn: Date.now(),
            trail: [],
            isPointerDown: false
        };
        setScore(0);
        setLives(3);
        setGameState('playing');
    };

    // ── Game Logic ────────────────────────────────────────────────────────────
    const spawnFruit = () => {
        const isBomb = Math.random() < 0.15;
        const emoji = isBomb ? BOMBS[0] : FRUITS[Math.floor(Math.random() * FRUITS.length)];

        return {
            x: Math.random() * (W - 100) + 50,
            y: H + FRUIT_SIZE,
            vx: (Math.random() - 0.5) * 8,
            vy: -(Math.random() * 5 + 13),
            emoji: emoji,
            isBomb: isBomb,
            sliced: false,
            id: Math.random(),
            rotation: 0,
            rotV: (Math.random() - 0.5) * 0.2
        };
    };

    const spawnParticle = (x, y, emoji, color) => {
        for (let i = 0; i < 6; i++) {
            stateRef.current.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1,
                emoji: emoji,
                color: color
            });
        }
    };

    const distToSegmentSquared = (p, v, w) => {
        const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
        if (l2 === 0) return (p.x - v.x) ** 2 + (p.y - v.y) ** 2;
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return (p.x - (v.x + t * (w.x - v.x))) ** 2 + (p.y - (v.y + t * (w.y - v.y))) ** 2;
    };

    const update = () => {
        if (gameState !== 'playing') return;

        const s = stateRef.current;
        const now = Date.now();

        // Spawn fruits
        if (now - s.lastSpawn > (1500 - Math.min(s.score * 5, 800))) {
            const count = Math.random() > 0.8 ? 2 : 1;
            for (let i = 0; i < count; i++) s.fruits.push(spawnFruit());
            s.lastSpawn = now;
        }

        // Update trail age
        for (let i = s.trail.length - 1; i >= 0; i--) {
            s.trail[i].age++;
            if (s.trail[i].age > 10) {
                s.trail.splice(i, 1);
            }
        }

        // Update fruits
        for (let i = s.fruits.length - 1; i >= 0; i--) {
            const f = s.fruits[i];
            f.x += f.vx;
            f.y += f.vy;
            f.vy += GRAVITY;
            f.rotation += f.rotV;

            // Check if sliced via trail
            if (!f.sliced && s.trail.length > 0) {
                let hit = false;

                // Compare fruit with trail segments
                for (let j = 0; j < s.trail.length - 1; j++) {
                    const p1 = s.trail[j];
                    const p2 = s.trail[j + 1];
                    const distSq = distToSegmentSquared({ x: f.x, y: f.y }, p1, p2);

                    if (distSq < (FRUIT_SIZE * 0.8) ** 2) {
                        hit = true;
                        break;
                    }
                }

                // Also check single points if trail is very short
                if (!hit && s.trail.length > 0) {
                    const p = s.trail[s.trail.length - 1];
                    const distSq = (f.x - p.x) ** 2 + (f.y - p.y) ** 2;
                    if (distSq < (FRUIT_SIZE * 0.8) ** 2) {
                        hit = true;
                    }
                }

                if (hit) {
                    f.sliced = true;
                    if (f.isBomb) {
                        s.lives--;
                        setLives(s.lives);
                        spawnParticle(f.x, f.y, '💥', '#ff0000');
                        s.trail = []; // clear trail on hit bomb
                        if (s.lives <= 0) {
                            setGameState('gameover');
                            scoreService.updateScore({ gameId: 'fruitninja', score: s.score }).catch(console.error);
                        }
                    } else {
                        s.score += 10;
                        setScore(s.score);
                        spawnParticle(f.x, f.y, '✨', '#ffff00');
                        // Combo logic
                        if (now - s.lastSliceTime < 500) s.combo++;
                        else s.combo = 1;
                        s.lastSliceTime = now;
                    }
                }
            }

            // Remove out of bounds
            if (f.y > H + 100) {
                if (!f.sliced && !f.isBomb) {
                    s.lives--;
                    setLives(s.lives);
                    if (s.lives <= 0) {
                        setGameState('gameover');
                        scoreService.updateScore({ gameId: 'fruitninja', score: s.score }).catch(console.error);
                    }
                }
                s.fruits.splice(i, 1);
            }
        }

        // Update particles
        for (let i = s.particles.length - 1; i >= 0; i--) {
            const p = s.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += GRAVITY * 0.5;
            p.life -= 0.02;
            if (p.life <= 0) s.particles.splice(i, 1);
        }
    };

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const s = stateRef.current;

        ctx.clearRect(0, 0, W, H);

        // Draw background
        const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W);
        grad.addColorStop(0, '#1e293b');
        grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Draw trail
        if (s.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(s.trail[0].x, s.trail[0].y);
            for (let i = 1; i < s.trail.length; i++) {
                ctx.lineTo(s.trail[i].x, s.trail[i].y);
            }
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = 8;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.stroke();

            ctx.lineWidth = 4;
            ctx.strokeStyle = '#38bdf8';
            ctx.stroke();
        }

        // Draw Fruits
        s.fruits.forEach(f => {
            ctx.save();
            // Reset shadows for iOS compatibility
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.translate(f.x, f.y);
            ctx.rotate(f.rotation);
            ctx.font = `${FRUIT_SIZE}px "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            if (f.sliced) {
                // Draw half fruit
                ctx.globalAlpha = 0.5;
                ctx.fillText(f.emoji, -15, 0);
                ctx.fillText(f.emoji, 15, 0);
            } else {
                ctx.fillText(f.emoji, 0, 0);
            }
            ctx.restore();
        });

        // Draw Particles
        s.particles.forEach(p => {
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.life * 5, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Draw Combo logic
        if (s.combo > 1) {
            ctx.save();
            ctx.font = 'bold 40px Inter';
            ctx.fillStyle = '#f59e0b';
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.textAlign = 'right';
            ctx.fillText(`${s.combo} COMBO!`, W - 20, H - 20);
            ctx.restore();
        }

        // Draw HUD Score
        ctx.font = '20px Inter';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${s.score}`, 20, H - 20);

        rafRef.current = requestAnimationFrame(() => {
            update();
            draw();
        });
    };

    useEffect(() => {
        if (gameState === 'playing' || gameState === 'menu') {
            draw();
        }
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [gameState]);

    // ── Pointer Handlers ──────────────────────────────────────────────────────
    const addPathPoint = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = W / rect.width;
        const scaleY = H / rect.height;

        let clientX = e.clientX;
        let clientY = e.clientY;

        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if (clientX === undefined) {
            return;
        }

        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;

        stateRef.current.trail.push({ x, y, age: 0 });
    };

    const handlePointerDown = (e) => {
        if (gameState !== 'playing') return;
        stateRef.current.isPointerDown = true;
        stateRef.current.trail = [];
        addPathPoint(e);
    };

    const handlePointerMove = (e) => {
        if (!stateRef.current.isPointerDown || gameState !== 'playing') return;
        addPathPoint(e);
        // Ngăn chặn cuộn trang khi vuốt trên màn hình cảm ứng
        if (e.touches) e.preventDefault();
    };

    const handlePointerUp = () => {
        stateRef.current.isPointerDown = false;
    };

    // ── Components ────────────────────────────────────────────────────────────
    const Overlay = ({ children }) => (
        <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '1.5rem',
            background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(8px)',
            padding: '2rem', zIndex: 20, textAlign: 'center'
        }}>
            {children}
        </div>
    );

    const BigBtn = ({ onClick, children, color = '#6366f1', icon: Icon }) => (
        <button onClick={onClick} style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.75rem 2.5rem', borderRadius: '1rem', border: 'none',
            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
            color: 'white', fontWeight: '700', fontSize: '1.1rem', cursor: 'pointer',
            boxShadow: `0 4px 24px ${color}55`,
            transition: 'transform 0.15s, box-shadow 0.15s',
        }}
            onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
            {Icon && <Icon size={20} />}
            {children}
        </button>
    );

    return (
        <div style={{
            minHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem',
            background: '', fontFamily: "'Inter', sans-serif", color: 'white'
        }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{
                    margin: 0, fontSize: '2.5rem', fontWeight: '900',
                    background: 'linear-gradient(to right, #38bdf8, #818cf8)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                    Swipe Fruit Ninja
                </h1>
                <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>
                    Sử dụng con trỏ chuột hoặc vuốt trên màn hình để chém hoa quả!
                </p>
            </div>

            {/* Stats Bar */}
            <div style={{
                display: 'flex', gap: '2rem', marginBottom: '1rem',
                background: 'rgba(255,255,255,0.05)', padding: '0.75rem 2rem',
                borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Trophy size={20} color="#f59e0b" />
                    <span style={{ fontSize: '1.2rem', fontWeight: '800' }}>{score}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <span key={i} style={{ fontSize: '1.2rem', opacity: i < lives ? 1 : 0.2 }}>❤️</span>
                    ))}
                </div>
            </div>

            {/* Game Canvas Container */}
            <div className='overflow-cont' style={{
                position: 'relative', width: W, height: H, maxWidth: '100%',
                borderRadius: '1.5rem', overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)', border: '2px solid rgba(255,255,255,0.1)',
                touchAction: 'none' /* Prevent scrolling from touch actions */
            }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
                onTouchCancel={handlePointerUp}
            >
                <canvas ref={canvasRef} width={W} height={H} style={{ display: 'block', maxWidth: '100%' }} />

                {/* Overlays */}
                {gameState === 'menu' && (
                    <Overlay>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Sẵn sàng chưa?</h2>
                        <p style={{ maxWidth: '300px', opacity: 0.8 }}>
                            Vuốt hoặc kéo thả chuột trên khu vực chơi để chém hoa quả. Đừng chém trúng bom nhé!
                        </p>
                        <BigBtn onClick={startGame} icon={Play}>Bắt đầu chơi</BigBtn>
                        <button onClick={() => window.history.back()} style={{
                            background: 'transparent', border: 'none', color: '#94a3b8',
                            display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer'
                        }}>
                            <ChevronLeft size={16} /> Quay lại
                        </button>
                    </Overlay>
                )}

                {gameState === 'gameover' && (
                    <Overlay>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#ef4444' }}>HẾT LƯỢT!</h2>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ margin: 0, opacity: 0.6 }}>Điểm của bạn</p>
                            <p style={{ fontSize: '3rem', fontWeight: '900', color: '#f59e0b' }}>{score}</p>
                        </div>
                        <BigBtn onClick={startGame} icon={RefreshCcw} color="#f59e0b">Chơi lại</BigBtn>
                        <BigBtn onClick={() => setGameState('menu')} color="#475569">Menu chính</BigBtn>
                    </Overlay>
                )}
            </div>

            {/* Instructions */}
            <div style={{
                marginTop: '1.5rem', display: 'flex', gap: '2rem',
                color: '#64748b', fontSize: '0.85rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Zap size={14} /> Tránh bom 💣
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Zap size={14} /> Đừng để hoa quả rơi
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MousePointer2 size={14} /> Vuốt / Kéo để chém
                </div>
            </div>

            <style jsx="true">{`
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
            <div style={{ marginTop: '0.5rem' }}>
                <button onClick={() => window.location.href = '/game-center'} style={{
                    background: 'rgba(255,165,0,0.1)', border: '1px solid orange',
                    color: 'orange', padding: '0.5rem 1rem', borderRadius: '0.75rem',
                    cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem'
                }}>
                    Quay lại Trung tâm trò chơi
                </button>
            </div>
        </div>
    );
};

export default FruitNinja;

import { useNavigate } from '@/next-compat';
import { useAuth } from '../context/AuthContext';
import { Image, MapPin, Smile, Send } from 'lucide-react';
import { motion } from 'framer-motion';

const CreatePostArea = ({ id }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    if (!user) return null;

    return (
        <motion.div
            id={id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="create-post-area home-create-post-area"
            onClick={() => navigate('/create-post')}
            style={{
                background: 'var(--card-dark)',
                borderRadius: '1rem',
                padding: '1.25rem',
                marginBottom: '2rem',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
            whileHover={{
                borderColor: 'var(--primary)',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)'
            }}
        >
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                <img
                    src={user.profilePicture || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/cartoon/${user.cartoonCharacter}.png`}
                    alt={user.displayName}
                    className="avatar"
                    style={{ width: '45px', height: '45px' }}
                />
                <div style={{
                    flex: 1,
                    background: 'var(--bg-dark)',
                    padding: '0.75rem 1.25rem',
                    borderRadius: '2rem',
                    color: 'var(--text-muted)',
                    fontSize: '0.95rem',
                    border: '1px solid var(--border)',
                    textAlign: 'left'
                }}>
                    Bạn định chia sẻ điều gì?
                </div>
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border)',
                color: 'var(--text-muted)'
            }}>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <div className="post-tool-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <Image size={18} color="#10b981" /> <span>Hình ảnh</span>
                    </div>
                    <div className="post-tool-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <MapPin size={18} color="#f43f5e" /> <span>Check-in</span>
                    </div>
                </div>
                <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.9rem' }}>
                    Đăng <Send size={16} />
                </div>
            </div>
        </motion.div>
    );
};

export default CreatePostArea;



import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
// Removed static import to avoid SSR errors
import { motion } from 'framer-motion';

const BirthdayCard = () => {
    const { user, updateUserLocal } = useAuth();
    const [dob, setDob] = useState('');
    const [loading, setLoading] = useState(false);

    // If user is not logged in or already has DOB, don't show the card
    if (!user || user.dateOfBirth) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!dob) return;

        setLoading(true);
        try {
            await api.put('/users/profile', {
                displayName: user.displayName,
                profilePicture: user.profilePicture,
                bio: user.bio,
                cartoonCharacter: user.cartoonCharacter,
                dateOfBirth: dob
            });
            updateUserLocal({ dateOfBirth: dob });
            
            // Dynamic import for client-only libraries
            const alertify = (await import('alertifyjs')).default;
            alertify.success('Đã lưu ngày sinh thành công! 🎂');
        } catch (err) {
            console.error(err);
            const alertify = (await import('alertifyjs')).default;
            alertify.error('Không thể lưu ngày sinh');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            className="post-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
                background: '#202020b5',
                color: 'white',
                textAlign: 'center',
                padding: '2rem',
                border: 'none',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
            }}
        >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎂</div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 700 }}>Ngày sinh của bạn là khi nào?</h2>
            <p style={{ marginBottom: '1.5rem', opacity: 0.9, fontSize: '0.9rem' }}>
                Giao diện BlogSocial của bạn sẽ được thay đổi vào ngày này!
            </p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: '0 auto' }}>
                <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    style={{
                        padding: '0.875rem',
                        borderRadius: '0.75rem',
                        border: '1px solid rgba(255,255,255,0.3)',
                        background: 'rgba(255,255,255,0.1)',
                        color: 'white',
                        outline: 'none',
                        fontSize: '1rem',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        minHeight: '3rem',
                        display: 'block',
                        width: '100%'
                    }}
                    required
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="auth-btn"
                    style={{
                        margin: 0,
                        background: '#ffffff',
                        color: '#000000',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                >
                    {loading ? 'Đang lưu...' : 'Xác nhận ngày sinh'}
                </button>
            </form>
        </motion.div>
    );
};

export default BirthdayCard;



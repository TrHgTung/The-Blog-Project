import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Gift } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SpecialCard = () => {
    const { updateUserLocal } = useAuth();
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const hasUsed = sessionStorage.getItem('specialCardUsed');
        if (hasUsed) {
            setIsVisible(false);
        }
    }, []);

    const handleLuckyDraw = () => {
        const randomcartoonId = Math.floor(Math.random() * 151) + 1;
        updateUserLocal({ cartoonCharacter: randomcartoonId.toString() });
        sessionStorage.setItem('specialCardUsed', 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            className="post-card"
            style={{
                background: 'linear-gradient(135deg, #1f1f1f, #3a3a3a)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                overflow: 'hidden',
                position: 'relative'
            }}
            onClick={handleLuckyDraw}
        >
            <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.1 }}>
                <Sparkles size={120} />
            </div>

            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <Gift size={48} style={{ marginBottom: '1rem' }} />
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>
                    Ôi my chuốiii
                </h2>
                <p style={{ opacity: 0.9, lineHeight: '1.6' }}>
                    Bạn đã tìm thấy một easter-egg <br />
                    Click vào đây để thay đổi nhân vật của bạn nhé!
                </p>

                <div style={{
                    marginTop: '1.5rem',
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '12px',
                    fontWeight: '600',
                    fontSize: '0.9rem'
                }}>
                    Thay đổi nhân vật tạm thời
                </div>
            </div>
        </motion.div>
    );
};

export default SpecialCard;



'use client';
import { useState } from 'react';
import { useLocation, useNavigate } from '@/next-compat';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
// import alertify from 'alertifyjs'; // Dynamic import instead
import api from '../services/api';
import '../component-css/Register.css'; // Reuse styles

import { useEffect } from 'react';

const VerifyEmail = () => {
    useEffect(() => {
        document.title = 'Xác minh Email | BlogSocial';
    }, []);
    const location = useLocation();
    const navigate = useNavigate();
    const [email, setEmail] = useState(() => {
        if (typeof window === 'undefined') return '';
        return location.state?.email || 
               new URLSearchParams(window.location.search).get('email') || 
               localStorage.getItem('pendingVerificationEmail') || 
               '';
    });
    const [verificationCode, setVerificationCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [idempotencyKey] = useState(typeof window !== 'undefined' ? crypto.randomUUID() : '');
    const { user, loading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && user) {
            navigate('/');
        }
    }, [user, authLoading, navigate]);

    if (authLoading) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await api.post('/auth/verify-email', { 
                email: email.trim() || null, // Send null if empty so backend searches by code
                verificationCode: verificationCode.trim() 
            }, {
                headers: { 'X-Idempotency-Key': idempotencyKey }
            });
            
            const alertify = (await import('alertifyjs')).default;
            alertify.success(res.data.message || 'Xác minh thành công!');
            
            // Clean up
            localStorage.removeItem('pendingVerificationEmail');
            navigate('/login');
        } catch (err) {
            const errorData = err.response?.data;
            if (typeof errorData === 'object' && errorData !== null) {
                const message = errorData.errors ? Object.values(errorData.errors).flat().join(', ') : (errorData.title || errorData.message || 'Xác minh thất bại');
                setError(message);
            } else {
                setError(errorData || 'Xác minh thất bại');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <motion.div
                className="auth-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                <h1 className="auth-title">Xác minh tài khoản</h1>
                
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        {email ? 'Mã xác minh đã được gửi đến email:' : 'Vui lòng nhập mã xác minh gồm 6 chữ số'}
                    </p>
                    {email && (
                        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                            <strong style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>{email}</strong>
                        </div>
                    )}
                </div>

                {error && (
                    <div style={{ 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        color: '#f87171', 
                        padding: '12px', 
                        borderRadius: '8px', 
                        marginBottom: '1.5rem', 
                        fontSize: '0.85rem',
                        textAlign: 'center',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginTop: '1rem' }}>
                        <label className="form-label reg-form-label" style={{ textAlign: 'center', display: 'block' }}>Mã xác minh</label>
                        <input
                            className="form-input"
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            maxLength={6}
                            required
                            autoFocus
                            placeholder="—— —— ——"
                            style={{ 
                                letterSpacing: '8px', 
                                textAlign: 'center', 
                                fontSize: '1.5rem', 
                                fontWeight: '900',
                                background: 'rgba(0,0,0,0.1)',
                                border: '2px solid var(--primary-light)'
                            }}
                        />
                    </div>

                    <button
                        className="auth-btn"
                        type="submit"
                        disabled={loading || verificationCode.length < 5}
                    >
                        {loading ? 'Đang xác minh...' : 'Xác minh'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default VerifyEmail;



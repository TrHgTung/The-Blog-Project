'use client';
import { useState } from 'react';
import { useNavigate, Link } from '@/next-compat';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
// import alertify from 'alertifyjs'; // Dynamic import instead
import api from '../services/api';
import '../component-css/Register.css'; // Reuse styles
import { Info } from 'lucide-react';

import { useEffect } from 'react';

const ForgotPassword = () => {
    useEffect(() => {
        document.title = 'Khôi phục mật khẩu | BlogSocial';
    }, []);
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Enter email, 2: Enter code & new password
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [forgotKey] = useState(typeof window !== 'undefined' ? crypto.randomUUID() : '');
    const [resetKey, setResetKey] = useState(typeof window !== 'undefined' ? crypto.randomUUID() : '');
    const { user, loading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && user) {
            navigate('/');
        }
    }, [user, authLoading, navigate]);

    if (authLoading) return null;

    const handleSendCode = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await api.post('/auth/forgot-password', { email }, {
                headers: { 'X-Idempotency-Key': forgotKey }
            });
            const alertify = (await import('alertifyjs')).default;
            alertify.success(res.data.message || 'Mã xác minh đã được gửi.');
            setStep(2);
        } catch (err) {
            const errorData = err.response?.data;
            if (typeof errorData === 'object' && errorData !== null) {
                const message = errorData.errors ? Object.values(errorData.errors).flat().join(', ') : (errorData.title || errorData.message || 'Có lỗi xảy ra.');
                setError(message);
            } else {
                setError(errorData || 'Có lỗi xảy ra.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await api.post('/auth/reset-password', {
                email,
                verificationCode,
                newPassword
            }, {
                headers: { 'X-Idempotency-Key': resetKey }
            });
            const alertify = (await import('alertifyjs')).default;
            alertify.success(res.data.message || 'Đổi mật khẩu thành công!');
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="auth-title">Khôi phục mật khẩu</h1>
                {error && <div className="error-msg" style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.form
                            key="step1"
                            onSubmit={handleSendCode}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <p style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--text-secondary)' }}>
                                Nhập email bạn đã đăng ký để nhận mã khôi phục.
                            </p>
                            <div className="form-group">
                                <label className="form-label reg-form-label">Email của bạn</label>
                                <input
                                    className="form-input"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <button
                                className="auth-btn"
                                type="submit"
                                disabled={loading || !email}
                            >
                                {loading ? 'Đang gửi mã...' : 'Gửi mã xác minh'}
                            </button>
                            <p className="auth-switch">
                                <Link to="/login">Trở lại Đăng nhập</Link>
                            </p>
                        </motion.form>
                    )}

                    {step === 2 && (
                        <motion.form
                            key="step2"
                            onSubmit={handleResetPassword}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <p style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--text-secondary)' }}>
                                Kiểm tra hòm thư của <strong>{email}</strong> để lấy mã xác minh.
                            </p>
                            <div className="form-group">
                                <label className="form-label reg-form-label">Mã xác minh</label>
                                <input
                                    className="form-input"
                                    type="text"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    maxLength={6}
                                    required
                                    placeholder="Ex: 123456"
                                    style={{ letterSpacing: '2px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label reg-form-label">
                                    Mật khẩu mới (Chỉ cho phép a-Z, 0-9, @, #)
                                    <Info
                                        size={16}
                                        style={{ marginLeft: '8px', cursor: 'pointer', verticalAlign: 'middle', color: 'var(--primary)' }}
                                        onClick={() => alert('Quy tắc mật khẩu: Chỉ cho phép các chữ cái không dấu, số hoặc 2 ký tự @ và #')}

                                    />
                                </label>
                                <input
                                    className="form-input"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    minLength={6}
                                    maxLength={32}
                                    required
                                    placeholder="Tối thiểu 6 ký tự, cho phép A-Z 0-9 và chỉ 2 ký tự @ #"
                                />
                            </div>

                            <button
                                className="auth-btn"
                                type="submit"
                                disabled={loading || verificationCode.length < 5 || newPassword.length < 6}
                            >
                                {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                            </button>
                            <p className="auth-switch">
                                <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '1rem', textDecoration: 'none' }}>
                                    Nhập lại email khác
                                </button>
                            </p>
                        </motion.form>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;



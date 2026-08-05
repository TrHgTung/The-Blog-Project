'use client';
import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from '@/next-compat';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
// import alertify from 'alertifyjs'; // Dynamic import instead
import 'alertifyjs/build/css/alertify.css';
import 'alertifyjs/build/css/themes/default.css';
import CaptchaWidget from '../components/CaptchaWidget';

const Login = () => {
    useEffect(() => {
        document.title = 'Đăng nhập | BlogSocial';
    }, []);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [captchaToken, setCaptchaToken] = useState(null);
    const captchaRef = useRef(null);
    const [idempotencyKey] = useState(typeof window !== 'undefined' ? crypto.randomUUID() : '');
    const { user, loading, login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && user) {
            navigate('/');
        }
    }, [user, loading, navigate]);

    if (loading) return null;

    const handleCaptchaVerify = (token) => {
        setCaptchaToken(token);
        setError('');
    };

    const handleCaptchaExpire = () => {
        setCaptchaToken(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!captchaToken) {
            return setError('Vui lòng xác nhận bạn không phải robot');
        }

        try {
            console.log('Sending login request...');
            const userData = await login(username, password, captchaToken, idempotencyKey);
            console.log('Login successful, userData:', userData);

            const checkIsBirthday = (dob) => {
                if (!dob) return false;
                const birthDate = new Date(dob);
                const today = new Date();
                return birthDate.getDate() === today.getDate() &&
                    birthDate.getMonth() === today.getMonth();
            };

            console.log('Importing alertify...');
            const alertify = (await import('alertifyjs')).default;
            console.log('Alertify imported:', !!alertify);

            alertify.set('notifier', 'position', 'bottom-left');
            if (checkIsBirthday(userData.dateOfBirth)) {
                alertify.success(`Bravo! Chúc mừng sinh nhật, ${userData.displayName || username}! 🎉`);
            } else {
                alertify.success(`Thân chào bạn, ${userData.displayName || username}`);
            }
            navigate('/');
        } catch (err) {
            console.error('Login Error Detailed:', err);
            const errorData = err.response?.data;
            if (typeof errorData === 'object' && errorData !== null) {
                const message = errorData.errors ? Object.values(errorData.errors).flat().join(', ') : (errorData.title || errorData.message || err.message || 'Login failed');
                setError(message);
            } else {
                setError(errorData || err.message || 'Login failed');
            }
            // Reset captcha khi đăng nhập thất bại để user phải verify lại
            captchaRef.current?.reset();
            setCaptchaToken(null);
        }
    };

    return (
        <div className="auth-container">
            <motion.div
                className="auth-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="auth-title">Hân hoan trở lại</h1>
                <h2 className="auth-subtitle">Chào buổi {new Date().getHours() < 12 ? 'sáng' : new Date().getHours() < 18 ? 'chiều' : 'tối'}!</h2>
                {error && <div className="error-msg login-error-msg">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label reg-form-label">Tên đăng nhập của bạn</label>
                        <input
                            className="form-input"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            maxLength={20}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label reg-form-label">Mật khẩu của bạn</label>
                        <input
                            className="form-input"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            maxLength={32}
                            required
                            placeholder='Mật khẩu của bạn'
                        />
                    </div>

                    <CaptchaWidget
                        captchaRef={captchaRef}
                        onVerify={handleCaptchaVerify}
                        onExpire={handleCaptchaExpire}
                    />

                    <button
                        className="auth-btn"
                        type="submit"
                        disabled={!captchaToken}
                    >
                        Đăng nhập
                    </button>
                </form>
                <p className="auth-switch">
                    Quên mật khẩu? <Link to="/forgot-password">Khôi phục ngay</Link>
                </p>
                <p className="auth-switch" style={{ marginTop: '0.5rem' }}>
                    Chưa có tài khoản sao? <Link to="/register">Hãy đăng ký miễn phí</Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Login;



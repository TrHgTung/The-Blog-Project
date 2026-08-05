'use client';
import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from '@/next-compat';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import CaptchaWidget from '../components/CaptchaWidget';
import '../component-css/Register.css';
import { containsBadWords } from '../utils/profanityFilter';
import { Info } from 'lucide-react';

const Register = () => {
    useEffect(() => {
        document.title = 'Đăng ký | BlogSocial';
    }, []);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        displayName: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [captchaToken, setCaptchaToken] = useState(null);
    const captchaRef = useRef(null);
    const [idempotencyKey] = useState(typeof window !== 'undefined' ? crypto.randomUUID() : '');
    const { user, loading, register } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && user) {
            navigate('/');
        }
    }, [user, loading, navigate]);

    if (loading) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCaptchaVerify = (token) => {
        setCaptchaToken(token);
        setError('');
    };

    const handleCaptchaExpire = () => {
        setCaptchaToken(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validUsernamePattern = /^[a-zA-Z0-9]+$/;
        const validPasswordPattern = /^[a-zA-Z0-9@#]+$/;

        if (!validUsernamePattern.test(formData.username)) {
            return setError('Tên đăng nhập chỉ được chứa chữ cái tiếng Anh và số, không bao gồm ký tự đặc biệt hay emoji.');
        }

        if (!validPasswordPattern.test(formData.password)) {
            return setError('Mật khẩu chỉ được chứa chữ cái tiếng Anh, số và các ký tự (@, #).');
        }

        if (containsBadWords(formData.username)) {
            return setError('Tên đăng nhập chứa từ ngữ không hợp lệ.');
        }

        if (containsBadWords(formData.displayName)) {
            return setError('Tên hiển thị chứa từ ngữ không hợp lệ.');
        }

        if (formData.password !== formData.confirmPassword) {
            return setError('Mật khẩu nhập lại không khớp');
        }

        if (!captchaToken) {
            return setError('Vui lòng xác nhận bạn không phải robot 🤖');
        }

        try {
            await register({
                username: formData.username,
                email: formData.email,
                displayName: formData.displayName,
                password: formData.password,
                captchaToken: captchaToken
            }, idempotencyKey);
            import('alertifyjs').then((alertify) => {
                alertify.default.success("Vui lòng kiểm tra email để nhận mã xác minh.");
            });
            localStorage.setItem('pendingVerificationEmail', formData.email);
            navigate('/verify-email', { state: { email: formData.email } });
        } catch (err) {
            const errorData = err.response?.data;
            if (typeof errorData === 'object' && errorData !== null) {
                const message = errorData.errors ? Object.values(errorData.errors).flat().join(', ') : (errorData.title || errorData.message || 'Registration failed');
                setError(message);
            } else {
                setError(errorData || 'Registration failed');
            }
            // Reset captcha khi có lỗi để user phải verify lại
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
                <h1 className="auth-title">Bắt đầu khám phá</h1>
                <h2 className="auth-subtitle">Một lần và mãi mãi</h2>
                {error && <div className="error-msg" style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label reg-form-label">Tên đăng nhập của bạn</label>
                        <input
                            name="username"
                            className="form-input"
                            type="text"
                            onChange={handleChange}
                            minLength={3}
                            maxLength={20}
                            pattern="^[a-zA-Z0-9]+$"
                            title="Tên đăng nhập chỉ được chứa chữ cái tiếng Anh và số"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label reg-form-label">Email của bạn</label>
                        <input
                            name="email"
                            className="form-input"
                            type="email"
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label reg-form-label">Tên hiển thị của bạn</label>
                        <input
                            name="displayName"
                            className="form-input"
                            type="text"
                            onChange={handleChange}
                            maxLength={50}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label reg-form-label">
                            Mật khẩu của bạn (a-Z, 0-9, @, #)
                            <Info
                                size={16}
                                style={{ marginLeft: '8px', cursor: 'pointer', verticalAlign: 'middle', color: 'var(--primary)' }}
                                onClick={() => alert('Quy tắc mật khẩu: Chỉ cho phép các chữ cái không dấu, số hoặc 2 ký tự @ và #')}

                            />
                        </label>
                        <input
                            name="password"
                            className="form-input"
                            type="password"
                            onChange={handleChange}
                            minLength={6}
                            maxLength={32}
                            pattern="^[a-zA-Z0-9@#]+$"
                            title="Tối thiểu 6 ký tự, cho phép A-Z 0-9 và chỉ 2 ký tự @ #"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label reg-form-label">Xác nhận mật khẩu bằng cách nhập lại y chang nhé</label>
                        <input
                            name="confirmPassword"
                            className="form-input"
                            type="password"
                            onChange={handleChange}
                            maxLength={32}
                            pattern="^[a-zA-Z0-9@#]+$"
                            title="Mật khẩu chỉ được chứa chữ cái tiếng Anh, số và các ký tự (@, #)"
                            required
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
                        Đăng ký tài khoản
                    </button>
                </form>
                <p className="auth-switch">
                    Hmm... Bạn đã có tài khoản rồi sao? <Link to="/login">Chỉ cần đăng nhập thôii</Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Register;



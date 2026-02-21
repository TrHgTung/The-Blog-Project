import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { Loader2 } from 'lucide-react';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            return setError('Passwords do not match');
        }

        setIsSubmitting(true);

        try {
            await api.post('/api/auth-service/Auth/register', {
                username: formData.username,
                email: formData.email,
                password: formData.password
            });

            setSuccess(true);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card glass-card">
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Tham gia cùng chúng tôi</h2>

                {error && <div className="error-msg">{error}</div>}
                {success && <div style={{ color: '#22c55e', padding: '0.5rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '0.25rem', marginBottom: '1rem', textAlign: 'center' }}>
                    Đăng ký thành công! Đang chuyển hướng...
                </div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Tên người dùng</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            className="form-input"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className="form-input"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Mật khẩu</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            className="form-input"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            className="form-input"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" className="btn" disabled={isSubmitting || success}>
                        {isSubmitting ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <Loader2 size={18} className="animate-spin" /> Đang xử lý...
                            </span>
                        ) : 'Đăng ký'}
                    </button>
                </form>

                <div className="auth-footer">
                    Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;

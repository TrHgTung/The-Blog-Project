import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Mail, Lock, Loader2 } from 'lucide-react';

const LoginPage = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const response = await api.post('/api/auth-service/Auth/login', formData);
            if (response.data.token && response.data.token.accessToken) {
                login(response.data.token.accessToken);
                navigate('/');
            } else {

                setError('Login failed. Please try again.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid username or password');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card glass-card">
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Bắt đầu hành trình</h2>

                {error && <div className="error-msg">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Tên đăng nhập</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                className="form-input"
                                placeholder="Nhập username của bạn"
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Mật khẩu</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                className="form-input"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <Loader2 size={18} className="animate-spin" /> Đang xử lý...
                            </span>
                        ) : 'Đăng nhập'}
                    </button>
                </form>

                <div className="auth-footer">
                    Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;

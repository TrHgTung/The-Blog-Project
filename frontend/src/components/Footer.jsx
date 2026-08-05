import React from 'react';
import { Link } from '@/next-compat';
import { Github, Globe } from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-grid">
                    {/* Brand Section */}
                    <div className="footer-section">
                        <Link to="/" className="footer-logo">
                            BlogSocial
                        </Link>
                        <p className="footer-description">
                            Hàng ngàn bài viết đang chờ bạn khám phá.
                        </p>
                        <div className="footer-socials">
                            <a href="https://github.com/TrHgTung" target="_blank" rel="noopener noreferrer nofollow" aria-label="GitHub" className="social-link">
                                <Github size={20} />
                            </a>
                            <a href="https://tungth.com" target="_blank" rel="sponsored" aria-label="Trịnh Hoàng Tùng Portfolio" className="social-link">
                                <Globe size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links Section */}
                    <div className="footer-section footer-section-last">
                        <h3 className="footer-heading">Điều hướng</h3>
                        <ul className="footer-links">
                            <li><Link to="/">Trang chủ</Link></li>
                            <li><Link to="/groups">Cộng đồng</Link></li>
                            <li><Link to="/about">Giới thiệu</Link></li>
                            <li><Link to="/magazine">Tạp chí</Link></li>
                        </ul>
                    </div>

                    <div className="footer-section footer-section-last">
                        <h3 className="footer-heading">Tiện ích</h3>
                        <ul className="footer-links">
                            <li><Link to="/countdown">Đếm ngược đến sự kiện</Link></li>
                            <li><Link to="/game-center">Giải trí & Trò chơi</Link></li>
                            <li><Link to="/privacy-policy">Chính sách bảo mật</Link></li>
                            <li><Link to="/my-characters" rel="noopener noreferrer nofollow">Bộ sưu tập easter-egg</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom">
                    <div className="footer-copyright">
                        <Link to="/" style={{ textDecoration: 'none', color: 'var(--text-muted)' }}>© {currentYear} BlogSocial - Lan tỏa những câu chuyện.</Link>
                    </div>
                    <div className="footer-credit" >
                        Cải tiến & Bảo trì: <Link to="/about">TrHgTung</Link>&nbsp; - &nbsp;Triển khai: 02/01/2026
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;



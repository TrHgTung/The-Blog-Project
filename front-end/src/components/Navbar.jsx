import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, LogIn, UserPlus, LogOut, User as UserIcon, FilePlus, MessageSquare, Users } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar glass-card">
            <div className="nav-brand">
                <Link to="/">The Blog Social</Link>
            </div>
            <div className="nav-links">
                <Link to="/" className="nav-item">
                    <Home size={20} />
                    <span>Trang chủ</span>
                </Link>
                <Link to="/groups" className="nav-item">
                    <Users size={20} />
                    <span>Nhóm Cộng đồng</span>
                </Link>

                {user ? (
                    <>
                        <Link to="/create-post" className="nav-item">
                            <FilePlus size={20} />
                            <span>Chia sẻ bài viết</span>
                        </Link>
                        <Link to="/chat" className="nav-item">
                            <MessageSquare size={20} />
                            <span>Trò chuyện</span>
                        </Link>
                        <Link to="/profile" className="nav-item">
                            <UserIcon size={20} />
                            <span>{user.name || 'Profile'}</span>
                        </Link>
                        <button onClick={handleLogout} className="nav-item logout-btn">
                            <LogOut size={20} />
                            <span>Đăng xuất</span>
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="nav-item">
                            <LogIn size={20} />
                            <span>Đăng nhập</span>
                        </Link>
                        <Link to="/register" className="nav-item">
                            <UserPlus size={20} />
                            <span>Đăng ký tham gia</span>
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;

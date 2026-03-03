import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, LogIn, UserPlus, LogOut, User as UserIcon, FilePlus, MessageSquare } from 'lucide-react';

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
                <Link to="/">The Blog</Link>
            </div>
            <div className="nav-links">
                <Link to="/" className="nav-item">
                    <Home size={20} />
                    <span>Home</span>
                </Link>

                {user ? (
                    <>
                        <Link to="/create-post" className="nav-item">
                            <FilePlus size={20} />
                            <span>Create Post</span>
                        </Link>
                        <Link to="/chat" className="nav-item">
                            <MessageSquare size={20} />
                            <span>Chat</span>
                        </Link>
                        <Link to="/profile" className="nav-item">
                            <UserIcon size={20} />
                            <span>{user.name || 'Profile'}</span>
                        </Link>
                        <button onClick={handleLogout} className="nav-item logout-btn">
                            <LogOut size={20} />
                            <span>Logout</span>
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="nav-item">
                            <LogIn size={20} />
                            <span>Login</span>
                        </Link>
                        <Link to="/register" className="nav-item">
                            <UserPlus size={20} />
                            <span>Register</span>
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { User, MessageCircle, UserPlus, UserMinus, ArrowLeft } from 'lucide-react';

const PublicProfilePage = () => {
    const { userId } = useParams();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPublicProfile = async () => {
            try {
                const response = await api.get(`/api/user-service/UserProfile/public-profile/${userId}`);
                setProfile(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching public profile:', err);
                setError('Could not load user profile.');
                setLoading(false);
            }
        };

        fetchPublicProfile();
    }, [userId]);

    const handleFollowToggle = async () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        try {
            if (profile.isFollowing) {
                await api.patch(`/api/user-service/UserRelationship/unfollow/${userId}`);
                setProfile({ ...profile, isFollowing: false });
            } else {
                await api.post(`/api/user-service/UserRelationship/follow/${userId}`);
                setProfile({ ...profile, isFollowing: true });
            }
        } catch (err) {
            console.error('Error toggling follow:', err);
        }
    };

    const handleStartChat = () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        // Navigate to chat page with this user selected
        navigate('/chat', { state: { startWithUser: profile } });
    };

    if (loading) return <div className="loading">Loading profile...</div>;
    if (error) return <div className="error-msg">{error}</div>;

    const isOwnProfile = currentUser?.id === userId;

    return (
        <div className="profile-container">
            <button className="back-btn" onClick={() => navigate(-1)}>
                <ArrowLeft size={20} /> Back
            </button>

            <div className="profile-header glass-card">
                <div className="cover-placeholder"></div>
                <div className="profile-info-main">
                    <div className="avatar-container">
                        <img
                            src={profile?.avatarImage || `https://ui-avatars.com/api/?name=${profile?.username}&background=random`}
                            alt="Avatar"
                            className="profile-avatar"
                        />
                    </div>
                    <div className="name-section">
                        <h1>{profile?.firstName} {profile?.lastName}</h1>
                        <p className="username">@{profile?.username}</p>
                        {profile?.bio && <p className="bio">{profile.bio}</p>}
                    </div>

                    {!isOwnProfile && (
                        <div className="actions-section">
                            <button
                                className={`btn ${profile.isFollowing ? 'unfollow-btn' : 'follow-btn'}`}
                                onClick={handleFollowToggle}
                            >
                                {profile.isFollowing ? <UserMinus size={18} /> : <UserPlus size={18} />}
                                <span>{profile.isFollowing ? 'Unfollow' : 'Follow'}</span>
                            </button>
                            <button className="btn chat-btn" onClick={handleStartChat}>
                                <MessageCircle size={18} />
                                <span>Message</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PublicProfilePage;

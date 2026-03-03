import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { User, Mail, MapPin, Briefcase, GraduationCap, Heart, Calendar, Camera, Edit3, Save, X } from 'lucide-react';

const ProfilePage = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/api/user-service/UserProfile/profile');
                setProfile(response.data);
                setFormData(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching profile:', err);
                setError('Could not load profile information.');
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.patch('/api/user-service/UserProfile/update-social-information', formData);
            setProfile(formData);
            setIsEditing(false);
        } catch (err) {
            console.error('Error updating profile:', err);
            setError('Failed to update profile.');
        }
    };

    if (loading) return <div className="loading">Loading profile...</div>;
    if (error) return <div className="error-msg">{error}</div>;

    return (
        <div className="profile-container">
            <div className="profile-header glass-card">
                <div className="cover-image">
                    {profile?.coverImage ? (
                        <img src={profile.coverImage} alt="Cover" />
                    ) : (
                        <div className="cover-placeholder"></div>
                    )}
                    <button className="edit-cover-btn"><Camera size={20} /></button>
                </div>
                <div className="profile-info-main">
                    <div className="avatar-container">
                        <img
                            src={profile?.avatarImage || `https://ui-avatars.com/api/?name=${profile?.username}&background=random`}
                            alt="Avatar"
                            className="profile-avatar"
                        />
                        <button className="edit-avatar-btn"><Camera size={16} /></button>
                    </div>
                    <div className="name-section">
                        <h1>{profile?.firstName} {profile?.lastName}</h1>
                        <p className="username">@{profile?.username}</p>
                    </div>
                    <div className="actions-section">
                        {!isEditing ? (
                            <button className="btn edit-btn" onClick={() => setIsEditing(true)}>
                                <Edit3 size={18} />
                                <span>Edit Profile</span>
                            </button>
                        ) : (
                            <div className="edit-actions">
                                <button className="btn save-btn" onClick={handleSubmit}>
                                    <Save size={18} />
                                    <span>Save</span>
                                </button>
                                <button className="btn cancel-btn" onClick={() => setIsEditing(false)}>
                                    <X size={18} />
                                    <span>Cancel</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="profile-content">
                <div className="profile-sidebar">
                    <div className="glass-card info-card">
                        <h3>About Me</h3>
                        {isEditing ? (
                            <textarea
                                name="bio"
                                value={formData.bio || ''}
                                onChange={handleChange}
                                placeholder="Tell us about yourself..."
                                className="form-input bio-input"
                            />
                        ) : (
                            <p className="bio">{profile?.bio || 'No bio yet.'}</p>
                        )}

                        <div className="info-items">
                            <div className="info-item">
                                <Mail size={18} />
                                <span>{profile?.email}</span>
                            </div>
                            <div className="info-item">
                                <MapPin size={18} />
                                {isEditing ? (
                                    <input name="currentCity" value={formData.currentCity || ''} onChange={handleChange} className="form-input-small" placeholder="City" />
                                ) : (
                                    <span>{profile?.currentCity || 'Location not set'}</span>
                                )}
                            </div>
                            <div className="info-item">
                                <Briefcase size={18} />
                                {isEditing ? (
                                    <input name="workplace" value={formData.workplace || ''} onChange={handleChange} className="form-input-small" placeholder="Workplace" />
                                ) : (
                                    <span>{profile?.workplace || 'Not specified'}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="profile-main">
                    <div className="glass-card details-grid">
                        <div className="detail-item">
                            <div className="detail-label"><GraduationCap size={16} /> Education</div>
                            {isEditing ? (
                                <input name="education" value={formData.education || ''} onChange={handleChange} className="form-input" />
                            ) : (
                                <div className="detail-value">{profile?.education || 'N/A'}</div>
                            )}
                        </div>
                        <div className="detail-item">
                            <div className="detail-label"><Heart size={16} /> Relationship</div>
                            {isEditing ? (
                                <input name="relationshipStatus" value={formData.relationshipStatus || ''} onChange={handleChange} className="form-input" />
                            ) : (
                                <div className="detail-value">{profile?.relationshipStatus || 'N/A'}</div>
                            )}
                        </div>
                        <div className="detail-item">
                            <div className="detail-label"><Calendar size={16} /> Birthday</div>
                            {isEditing ? (
                                <input type="date" name="dateOfBirth" value={formData.dateOfBirth?.split('T')[0] || ''} onChange={handleChange} className="form-input" />
                            ) : (
                                <div className="detail-value">{profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'N/A'}</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;

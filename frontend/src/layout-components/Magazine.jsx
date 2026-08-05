'use client';
import { useState } from 'react';
import CreateMagazine from '../components/CreateMagazine';
import MagazineList from '../components/MagazineList';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Magazine = () => {
    const [activeTab, setActiveTab] = useState('list');
    const { user } = useAuth(); // If only logged in users can create

    return (
        <div className="container" style={{ maxWidth: '1200px', padding: '1rem' }}>


            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)' }}>Bộ sưu tập Tạp Chí</h1>
                <p style={{ fontSize: '0.75rem', maxWidth: '45%', fontStyle: 'italic', color: 'var(--text-muted)' }}>Khám phá những câu chuyện tuyệt vời từ khắp mọi nơi, khơi gợi sự sáng tạo của mọi người.</p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0', marginBottom: '2.5rem', width: '100%', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', overflowX: 'hidden' }}>
                <button
                    onClick={() => setActiveTab('list')}
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '1.05rem',
                        fontWeight: activeTab === 'list' ? 'bold' : '500',
                        color: activeTab === 'list' ? 'var(--primary)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '0.5rem 1rem',
                        borderBottom: activeTab === 'list' ? '2px solid var(--primary)' : '2px solid transparent',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap'
                    }}
                >
                    Bộ sưu tập
                </button>

                {user && (
                    <button
                        onClick={() => setActiveTab('create')}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '1.05rem',
                            fontWeight: activeTab === 'create' ? 'bold' : '500',
                            color: activeTab === 'create' ? 'var(--primary)' : 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '0.5rem 1rem',
                            borderBottom: activeTab === 'create' ? '2px solid var(--primary)' : '2px solid transparent',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        Công bố Tạp chí mới
                    </button>
                )}
            </div>

            <div className='magazine-subtitle'>
                Tạo tạp chí mới của riêng bạn và cho mọi người cùng xem trong Tab <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Công bố Tạp chí mới</span>
            </div>

            {/* Tab Content */}
            <div className="magazine-tab-content">
                {activeTab === 'list' && <MagazineList />}
                {activeTab === 'create' && <CreateMagazine />}
            </div>

        </div>
    );
};

export default Magazine;



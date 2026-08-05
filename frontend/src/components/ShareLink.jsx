import { Share2, Check } from 'lucide-react';
import { useState } from 'react';

const ShareLink = () => {
    const [copied, setCopied] = useState(false);
    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                    onClick={handleCopyLink}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.5rem', borderRadius: '0.75rem',
                        background: copied ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                        color: copied ? 'white' : 'var(--text-main)',
                        border: '1px solid var(--border)', cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        fontSize: '0.75rem', fontWeight: '500'
                    }}
                >
                    {copied ? <Check size={18} /> : <Share2 size={18} />}
                    {copied ? 'Đã sao chép' : 'Chia sẻ'}
                </button>
            </div>
        </>
    );
};

export default ShareLink;


import { useLocation } from '@/next-compat';
import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FloatingActionButton = () => {
    const location = useLocation();

    // Don't show if on search page
    if (location.pathname === '/search') {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                    scale: 1,
                    opacity: 1,
                    y: [0, -8, 0]
                }}
                transition={{
                    y: {
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    },
                    scale: { duration: 0.3 },
                    opacity: { duration: 0.3 }
                }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.1, y: 0 }}
                whileTap={{ scale: 0.9 }}
                className="fab-container"
            >
                <button 
                    onClick={() => document.dispatchEvent(new CustomEvent('openSearch'))} 
                    className="fab-button" 
                    title="Tìm kiếm"
                    style={{ border: 'none', cursor: 'pointer' }}
                >
                    <Search size={20} />
                </button>
            </motion.div>
        </AnimatePresence>
    );
};

export default FloatingActionButton;



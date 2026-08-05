import { Link, useLocation } from '@/next-compat';
import { House } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LogoMobileUI = () => {
    const location = useLocation();
    const logo = process.env.NEXT_PUBLIC_APP_URL + "/favicon.png";

    // Don't show if already on /about page
    if (location.pathname === '/about') {
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
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    },
                    scale: { duration: 0.3 },
                    opacity: { duration: 0.3 }
                }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.1, y: 0 }}
                whileTap={{ scale: 0.9 }}
                className="logo-mobile-container"
            >
                <Link to="/" className="logo-mobile-button" title="Trang chủ">
                    <House size={20} />
                </Link>
            </motion.div>
        </AnimatePresence>
    );
};

export default LogoMobileUI;


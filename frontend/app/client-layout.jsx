'use client';

import { useEffect } from 'react';
import { useAuth } from '../src/context/AuthContext';
import Navbar from '../src/components/Navbar';
import BottomNav from '../src/components/BottomNav';
import SearchBar from '../src/components/SearchBar';
// import FloatingActionButton from '../src/components/FloatingActionButton';
// import LogoMobileUI from '../src/components/LogoMobileUI';
import Footer from '../src/components/Footer';
import CookieBanner from '../src/components/CookieBanner';
import { usePathname } from 'next/navigation';
import api from '../src/services/api';

import { Suspense } from 'react';

export default function ClientLayout({ children }) {
  const { isBirthday } = useAuth();

  useEffect(() => {
    const handleTouchStart = (e) => {
      const nav = document.querySelector(".bottom-nav");
      if (!nav) return;
      if (nav.contains(e.target)) {
        nav.classList.add("other-focused");
      } else {
        nav.classList.remove("other-focused");
      }
    };

    document.addEventListener("touchstart", handleTouchStart);
    return () => document.removeEventListener("touchstart", handleTouchStart);
  }, []);

  const pathname = usePathname();

  useEffect(() => {
    // 5-second delayed visitor check (runs only once per browser session/device)
    const visitorToken = localStorage.getItem('application_visitor_id');
    const alreadyCounted = sessionStorage.getItem('application_session_counted');

    if (!alreadyCounted) {
      const timer = setTimeout(() => {
        let currentId = visitorToken;
        if (!currentId) {
          currentId = 'v_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          localStorage.setItem('application_visitor_id', currentId);
        }

        api.post('/checkpoint/hit', { sessionId: currentId })
          .then(() => {
            sessionStorage.setItem('application_session_counted', 'true');
          })
          .catch(err => console.error('Failed to record visitor:', err));
      }, 5000); // 5 seconds delay

      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className={`app-wrapper ${isBirthday ? 'is-birthday' : ''}`}>
      <Suspense fallback={null}>
        <Navbar />
        <SearchBar />
        <BottomNav />
        <main className="main-content">
          {children}
        </main>
        {/* <FloatingActionButton /> */}
        {/* <LogoMobileUI /> */}
        <Footer />
        <CookieBanner />
      </Suspense>
    </div>
  );
}

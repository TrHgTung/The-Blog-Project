import { BrowserRouter as Router, Routes, Route, Navigate } from '@/next-compat';
import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import CreatePost from './pages/CreatePost';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import BottomNav from './components/BottomNav';
import TranslateBar from './components/TranslateBar';
import AboutAuthor from './pages/AboutAuthor';
import Notifications from './pages/Notifications';
import Countdown from './pages/Countdown';
import PostDetails from './pages/PostDetails';
import MiniGame from './layout-components/MiniGame';
import FruitNinja from './layout-components/FruitNinja';
import Footer from './components/Footer';
// import FloatingActionButton from './components/FloatingActionButton';
// import LogoMobileUI from './components/LogoMobileUI';
import './App.css';
import SearchBar from './components/SearchBar';
import SearchResults from './pages/SearchResults';
import Magazine from './pages/Magazine';
import MagazineDetails from './pages/MagazineDetails';
import LandingPage from './layout-components/LandingPage';
import FoodStall from './layout-components/FoodStall';
import GameCenter from './layout-components/GameCenter';
import PrivacyPolicy from './layout-components/PrivacyPolicy';
import Mycartoon from './layout-components/Mycartoon';
// import OnboardScreen from './components/OnboardScreen';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const { isBirthday } = useAuth();

  useEffect(() => {
    // const checkIsNewUser = localStorage.getItem('isOldUser');
    // if (!checkIsNewUser || checkIsNewUser == false) {
    //   localStorage.setItem('isOldUser', true);

    //   return <OnboardScreen />
    // }

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

  return (
    <Router>
      <div className={`app-wrapper ${isBirthday ? 'is-birthday' : ''}`}>
        <Navbar />
        <SearchBar />
        <TranslateBar />
        <BottomNav />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/create-post" element={
              <ProtectedRoute>
                <CreatePost />
              </ProtectedRoute>
            } />
            <Route path="/post/:slug" element={<PostDetails />} />
            <Route path="/edit-post/:id" element={
              <ProtectedRoute>
                <CreatePost />
              </ProtectedRoute>
            } />
            <Route path="/magazine" element={
              <ProtectedRoute>
                <Magazine />
              </ProtectedRoute>
            } />
            <Route path="/magazine/:slug" element={<MagazineDetails />} />

            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/chat" element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            } />
            <Route path="/groups" element={
              <ProtectedRoute>
                <Groups />
              </ProtectedRoute>
            } />
            <Route path="/groups/:slug" element={
              <ProtectedRoute>
                <GroupDetail />
              </ProtectedRoute>
            } />
            <Route path="/about" element={<AboutAuthor />} />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            } />
            <Route path="/countdown" element={<Countdown />} />
            <Route path="/mini-game" element={<MiniGame />} />
            <Route path="/fruit-ninja" element={<FruitNinja />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/landing-page" element={<LandingPage />} />
            <Route path="/what-should-i-eat" element={<FoodStall />} />
            <Route path="/game-center" element={<GameCenter />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/my-characters" element={<Mycartoon />} />
          </Routes>
        </main>
        {/* <FloatingActionButton />
        <LogoMobileUI /> */}
        <Footer />
      </div>
    </Router>
  );
}

export default App;



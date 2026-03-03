import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import MainLayout from './layout/MainLayout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CreatePostPage from './pages/CreatePostPage'
import ProfilePage from './pages/ProfilePage'
import ChatPage from './pages/ChatPage'
import './App.css'

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="app-container">
                    <MainLayout>
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                            <Route path="/create-post" element={<CreatePostPage />} />
                            <Route path="/profile" element={<ProfilePage />} />
                            <Route path="/chat" element={<ChatPage />} />
                        </Routes>
                    </MainLayout>
                </div>
            </Router>
        </AuthProvider>
    )
}

export default App

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import SchedulePage from './pages/SchedulePage';
import CheersYearPage from './pages/CheersYearPage';
import CheersVideoPage from './pages/CheersVideoPage';
import GamesPage from './pages/GamesPage';
import HistoryPage from './pages/HistoryPage';
import PopcatPage from './pages/PopcatPage';
import UpcomingPage from './pages/UpcomingPage';
import './App.css';

export default function App() {
    return (
        <BrowserRouter>
            <div className="app">
                <Routes>
                    <Route element={<Layout />}>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/schedule" element={<SchedulePage />} />
                        <Route path="/cheers" element={<CheersYearPage />} />
                        <Route path="/cheers/:yearId" element={<CheersVideoPage />} />
                        <Route path="/games" element={<GamesPage />} />
                        <Route path="/history" element={<HistoryPage />} />
                        <Route path="/popcat" element={<PopcatPage />} />
                        <Route path="/upcoming" element={<UpcomingPage />} />
                        {/* 기존 경로 호환 */}
                        <Route path="/years" element={<Navigate to="/cheers" replace />} />
                        <Route path="/videos/:yearId" element={<LegacyVideoRedirect />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Routes>
            </div>
        </BrowserRouter>
    );
}

function LegacyVideoRedirect() {
    const path = window.location.pathname.replace('/videos/', '/cheers/');
    return <Navigate to={path} replace />;
}

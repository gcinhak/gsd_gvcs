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
import LivePage from './pages/LivePage';
import LiveMatchPage from './pages/LiveMatchPage';
import AdminRelayPage from './pages/AdminRelayPage';
import LineupPage from './pages/LineupPage';
import './App.css';

export default function App() {
    return (
        <BrowserRouter>
            <div className="app">
                <Routes>
                    {/* 관리자 — Layout 없이 단독 노출 (네비/푸터에서 숨김) */}
                    <Route path="/admin/relay" element={<AdminRelayPage />} />

                    <Route element={<Layout />}>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/live" element={<LivePage />} />
                        <Route path="/live/:matchId" element={<LiveMatchPage />} />
                        <Route path="/schedule" element={<SchedulePage />} />
                        <Route path="/lineup" element={<LineupPage />} />
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

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useCountdown from '../hooks/useCountdown';
import { UPCOMING_FEATURES } from '../data';

function Digit({ value, label }) {
    const str = String(value).padStart(2, '0');
    return (
        <div className="digit-box">
            <div className="digit-num">{str}</div>
            <div className="digit-label">{label}</div>
        </div>
    );
}

const QUICK_LINKS = [
    { to: '/schedule', emoji: '📅', label: '경기 일정', desc: '예선(5/28~29) · 본선(5/30)' },
    { to: '/cheers', emoji: '📣', label: '응원전 영상', desc: '연도별 / 캠퍼스별' },
    { to: '/games', emoji: '🏆', label: '경기 영상', desc: '연도별 / 종목별' },
    { to: '/history', emoji: '📊', label: '역대 전적', desc: '종합 우승 · 응원전 · 스코어' },
    { to: '/popcat', emoji: '😺', label: '팝캣 응원', desc: '클릭으로 응원 누적' },
    { to: '/upcoming', emoji: '✨', label: '예정 기능', desc: '실시간 중계 · 라인업 등' },
];

export default function HomePage() {
    const navigate = useNavigate();
    const { days, hours, minutes, seconds } = useCountdown();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setReady(true), 60);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className={`page hero-page ${ready ? 'ready' : ''}`}>
            <section className="hero-bg">
                <div className="hero-inner-top">
                    <span className="hero-badge anim-1">GLOBAL SPORTS FESTIVAL · PRE-OPEN</span>
                    <h1 className="hero-title anim-2">
                        <span className="ht-year">2026</span>
                        <span className="ht-main">글로벌 체육 축제</span>
                    </h1>
                    <p className="hero-date anim-3">2026년 5월 30일 (토) 09:00</p>
                </div>
            </section>

            <div className="countdown anim-4">
                <Digit value={days} label="DAYS" />
                <span className="cd-sep">:</span>
                <Digit value={hours} label="HOURS" />
                <span className="cd-sep">:</span>
                <Digit value={minutes} label="MIN" />
                <span className="cd-sep">:</span>
                <Digit value={seconds} label="SEC" />
            </div>

            <div className="hero-body">
                <div className="hero-actions anim-5">
                    <button className="enter-btn" onClick={() => navigate('/cheers')}>
                        <span>역대 응원전 보기</span>
                        <span className="arrow-right">→</span>
                    </button>
                    <button className="enter-btn outlined" onClick={() => navigate('/schedule')}>
                        <span>경기 일정 보기</span>
                        <span className="arrow-right">→</span>
                    </button>
                </div>

                <div className="quick-grid anim-6">
                    {QUICK_LINKS.map((q) => (
                        <button key={q.to} className="quick-card" onClick={() => navigate(q.to)}>
                            <span className="qc-emoji" aria-hidden>{q.emoji}</span>
                            <span className="qc-text">
                                <span className="qc-label">{q.label}</span>
                                <span className="qc-desc">{q.desc}</span>
                            </span>
                            <span className="qc-arrow">→</span>
                        </button>
                    ))}
                </div>

                <div className="upcoming-strip anim-6">
                    <span className="us-tag">UPCOMING</span>
                    <span>
                        {UPCOMING_FEATURES.slice(0, 3).map((f) => f.title).join(' · ')} 외{' '}
                        {UPCOMING_FEATURES.length - 3}개 기능 준비중
                    </span>
                </div>
            </div>
        </div>
    );
}

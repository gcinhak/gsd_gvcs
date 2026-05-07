import { useState, useEffect, useRef } from 'react';
import { YEARS, TARGET_DATE } from './data';
import './App.css';

/* ── Countdown Hook ── */
function useCountdown() {
    const calc = () => {
        const diff = TARGET_DATE - new Date();
        if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        return {
            days: Math.floor(diff / 86400000),
            hours: Math.floor((diff % 86400000) / 3600000),
            minutes: Math.floor((diff % 3600000) / 60000),
            seconds: Math.floor((diff % 60000) / 1000),
        };
    };
    const [time, setTime] = useState(calc);
    useEffect(() => {
        const id = setInterval(() => setTime(calc()), 1000);
        return () => clearInterval(id);
    }, []);
    return time;
}

/* ── Floating particles ── */
function Sparks({ color }) {
    const items = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 4,
        dur: 3 + Math.random() * 4,
        size: 3 + Math.random() * 6,
    }));
    return (
        <div className="sparks" aria-hidden>
            {items.map((p) => (
                <span
                    key={p.id}
                    className="spark"
                    style={{
                        left: `${p.x}%`,
                        width: p.size,
                        height: p.size,
                        background: color,
                        animationDuration: `${p.dur}s`,
                        animationDelay: `${p.delay}s`,
                        boxShadow: `0 0 6px ${color}`,
                    }}
                />
            ))}
        </div>
    );
}

/* ── Countdown unit ── */
function Digit({ value, label }) {
    const str = String(value).padStart(2, '0');
    return (
        <div className="digit-box">
            <div className="digit-num">{str}</div>
            <div className="digit-label">{label}</div>
        </div>
    );
}

/* ── PAGE 1: Hero / Landing ── */
function HeroPage({ onEnter }) {
    const { days, hours, minutes, seconds } = useCountdown();
    const [ready, setReady] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setReady(true), 80);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className={`page hero-page ${ready ? 'ready' : ''}`}>
            <div className="hero-bg" />
            <Sparks color="#FFD700" />

            <div className="hero-inner">
                <div className="hero-badge anim-1">GLOBAL SPORTS FESTIVAL</div>

                <h1 className="hero-title anim-2">
                    <span className="ht-year">2026</span>
                    <span className="ht-main">
                        글로벌
                        <br />
                        체육 축제
                    </span>
                </h1>

                <p className="hero-date anim-3">📅 2026년 5월 31일 개막</p>

                <div className="countdown anim-4">
                    <Digit value={days} label="일" />
                    <span className="cd-sep">:</span>
                    <Digit value={hours} label="시간" />
                    <span className="cd-sep">:</span>
                    <Digit value={minutes} label="분" />
                    <span className="cd-sep">:</span>
                    <Digit value={seconds} label="초" />
                </div>

                <p className="hero-sub anim-5">지난 응원전을 돌아보며 2026년을 함께 기대해요!</p>

                <button className="enter-btn anim-6" onClick={onEnter}>
                    <span>역대 응원전 보러가기</span>
                    <span className="arrow-right">→</span>
                </button>
            </div>

            <div className="hero-bottom-bar" />
        </div>
    );
}

/* ── PAGE 2: Year Select ── */
function YearSelectPage({ onSelect, onBack }) {
    return (
        <div className="page year-page">
            <div className="year-bg" />
            <div className="year-inner">
                <button className="back-btn" onClick={onBack}>
                    ← 메인으로
                </button>
                <h2 className="year-heading">
                    <span className="yh-sub">GLOBAL SPORTS FESTIVAL</span>
                    <span className="yh-main">역대 응원전</span>
                </h2>
                <p className="year-sub">연도를 선택하여 응원전 영상을 감상하세요</p>

                <div className="year-grid">
                    {YEARS.map((y, i) => (
                        <button
                            key={y.year}
                            className="year-card"
                            style={{ '--accent': y.color, '--glow': y.glow, animationDelay: `${i * 0.1}s` }}
                            onClick={() => onSelect(y)}
                        >
                            <div className="yc-year">{y.year}</div>
                            <div className="yc-label">글로벌 체육 축제</div>
                            <div className="yc-count">{y.videos.length}개 영상</div>
                            <div className="yc-campuses">
                                {[...new Set(y.videos.map((v) => v.campus))].map((c) => (
                                    <span key={c} className="yc-campus-tag">
                                        {c}
                                    </span>
                                ))}
                            </div>
                            <div className="yc-arrow">▶</div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ── PAGE 3: Video List ── */
function VideoListPage({ yearData, onBack }) {
    const [playing, setPlaying] = useState(null);

    return (
        <div className="page video-list-page">
            <div className="vl-bg" style={{ '--accent': yearData.color, '--glow': yearData.glow }} />

            <div className="vl-inner">
                <div className="vl-top">
                    <button className="back-btn" onClick={onBack}>
                        ← 연도 선택
                    </button>
                    <h2 className="vl-title">
                        <span className="vl-year" style={{ color: yearData.color }}>
                            {yearData.year}
                        </span>
                        <span> 글로벌 체육 축제 응원전</span>
                    </h2>
                </div>

                {playing !== null ? (
                    <div className="player-wrap">
                        <div className="player-tabs">
                            {yearData.videos.map((v, i) => (
                                <button
                                    key={v.id}
                                    className={`player-tab ${playing === i ? 'active' : ''}`}
                                    style={{ '--accent': yearData.color }}
                                    onClick={() => setPlaying(i)}
                                >
                                    {v.label}
                                </button>
                            ))}
                        </div>
                        <div className="player-frame">
                            <iframe
                                key={yearData.videos[playing].id}
                                src={`https://www.youtube.com/embed/${yearData.videos[playing].id}?autoplay=1&rel=0&modestbranding=1`}
                                title={yearData.videos[playing].label}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                        <button className="close-player" onClick={() => setPlaying(null)}>
                            ✕ 목록으로
                        </button>
                    </div>
                ) : (
                    <div className="thumb-grid">
                        {yearData.videos.map((v, i) => (
                            <button key={v.id} className="thumb-card" onClick={() => setPlaying(i)}>
                                <div className="thumb-img-wrap">
                                    <img
                                        src={`https://img.youtube.com/vi/${v.id}/maxresdefault.jpg`}
                                        alt={v.label}
                                        onError={(e) => {
                                            e.target.src = `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`;
                                        }}
                                    />
                                    <div className="thumb-overlay">
                                        <div className="play-btn" style={{ background: yearData.color }}>
                                            ▶
                                        </div>
                                    </div>
                                </div>
                                <div className="thumb-info">
                                    <span className="thumb-campus" style={{ background: yearData.color }}>
                                        {v.campus}
                                    </span>
                                    <span className="thumb-label">{v.label}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── App Root ── */
export default function App() {
    const [page, setPage] = useState('hero'); // hero | years | videos
    const [selectedYear, setSelectedYear] = useState(null);
    const [prev, setPrev] = useState(null);
    const [dir, setDir] = useState('forward');

    function navigate(to, data = null, direction = 'forward') {
        setDir(direction);
        setPrev(page);
        if (data) setSelectedYear(data);
        setTimeout(() => {
            setPage(to);
            setPrev(null);
        }, 20);
    }

    return (
        <div className="app" data-dir={dir}>
            {page === 'hero' && <HeroPage onEnter={() => navigate('years')} />}
            {page === 'years' && (
                <YearSelectPage onSelect={(y) => navigate('videos', y)} onBack={() => navigate('hero', null, 'back')} />
            )}
            {page === 'videos' && selectedYear && (
                <VideoListPage yearData={selectedYear} onBack={() => navigate('years', null, 'back')} />
            )}
        </div>
    );
}

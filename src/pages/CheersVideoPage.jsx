import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { YEARS } from '../data';

// 인택이가 작업을 시작합니다.
// asdasd
// asdasd

export default function CheersVideoPage() {
    const { yearId } = useParams();
    const navigate = useNavigate();
    const [playing, setPlaying] = useState(null);

    const yearData = YEARS.find((y) => String(y.year) === yearId);

    if (!yearData) {
        return (
            <div className="page video-list-page">
                <div className="vl-inner">
                    <button className="back-btn" onClick={() => navigate('/cheers')}>
                        ← 연도 선택
                    </button>
                    <p style={{ color: 'var(--muted)', marginTop: '2rem' }}>해당 연도 데이터를 찾을 수 없습니다.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page video-list-page">
            <div className="vl-inner">
                <div className="vl-top">
                    <button className="back-btn" onClick={() => navigate('/cheers')}>
                        ← 연도 선택
                    </button>
                    <h2 className="vl-title">
                        <span className="vl-year" style={{ color: yearData.color }}>
                            {yearData.year}
                        </span>
                        글로벌 체육 축제 응원전
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
                            <div className="player-watermark">
                                <span>made by Sync</span>
                            </div>
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

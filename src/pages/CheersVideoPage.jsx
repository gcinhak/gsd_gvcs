import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
// 1. data.js에서 정의해둔 CAMPUS_COLORS를 추가로 불러옵니다.
import { YEARS, CAMPUS_COLORS } from '../data'; 

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

    // 💡 2. 캠퍼스 이름에 따라 고유의 색상을 반환해주는 함수를 만듭니다.
    const getCampusColor = (campusName) => {
        if (!campusName) return yearData.color;
        if (campusName.includes('음성')) return CAMPUS_COLORS['음성']?.bg || '#dc2626'; // 빨강
        if (campusName.includes('문경')) return CAMPUS_COLORS['문경']?.bg || '#1d4ed8'; // 파랑
        return yearData.color; // 기본값은 해당 연도 색상
    };

    return (
        <div className="page video-list-page">
            <div className="vl-inner">
                <div className="vl-top">
                    <button className="back-btn" onClick={() => navigate('/cheers')}>
                        ← 연도 선택
                    </button>
                    <h2 className="vl-title">
                        <span className="vl-year" style={{ color: yearData.color }}>{yearData.year}</span>
                        글로벌 체육 축제 응원전
                    </h2>
                </div>

                {playing !== null ? (
                    <div className="player-wrap">
                        <div className="player-tabs">
                            {yearData.videos.map((v, i) => {
                                // 💡 3. 재생 탭 색상도 캠퍼스에 맞게 지정합니다.
                                const tabColor = getCampusColor(v.campus);
                                return (
                                    <button
                                        key={v.id}
                                        className={`player-tab ${playing === i ? 'active' : ''}`}
                                        style={{ '--accent': tabColor }} // yearData.color 대신 tabColor 사용
                                        onClick={() => setPlaying(i)}
                                    >
                                        {v.label}
                                    </button>
                                );
                            })}
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
                        {yearData.videos.map((v, i) => {
                            // 💡 4. 비디오 썸네일과 뱃지에 들어갈 색상을 계산합니다.
                            const badgeColor = getCampusColor(v.campus);

                            return (
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
                                            {/* 💡 5. 플레이 버튼 색상 적용 */}
                                            <div className="play-btn" style={{ background: badgeColor }}>
                                                ▶
                                            </div>
                                        </div>
                                    </div>
                                    <div className="thumb-info">
                                        {/* 💡 6. 둥근 뱃지 색상 적용 */}
                                        <span className="thumb-campus" style={{ background: badgeColor }}>
                                            {v.campus}
                                        </span>
                                        <span className="thumb-label">{v.label}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
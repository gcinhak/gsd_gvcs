import { useNavigate } from 'react-router-dom';
import { YEARS } from '../data/data';
import PageHeader from '../components/PageHeader';

export default function CheersYearPage() {
    const navigate = useNavigate();
    return (
        <div className="page year-page">
            <div className="year-bg" />
            <div className="year-inner">
                <PageHeader
                    eyebrow="GLOBAL SPORTS FESTIVAL"
                    title="역대 응원전"
                    description="연도별 · 캠퍼스별 응원전 영상을 모아봤습니다."
                />

                <div className="year-grid">
                    {YEARS.map((y, i) => (
                        <button
                            key={y.year}
                            className="year-card"
                            style={{ '--accent': y.color, animationDelay: `${i * 0.08}s` }}
                            onClick={() => navigate(`/cheers/${y.year}`)}
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

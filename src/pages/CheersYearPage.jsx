import { useNavigate } from 'react-router-dom';
import { CURRENT_YEAR, YEARS } from '../data/data';
import PageHeader from '../components/PageHeader';
import { SeasonPending } from '../components/SeasonBlocks';

export default function CheersYearPage() {
    const navigate = useNavigate();
    // 2027 응원전 영상이 YEARS 에 들어오면 맨 앞 카드로 자동 노출, 없으면 「미정」
    const hasCurrent = YEARS.some((y) => y.year === CURRENT_YEAR && y.videos.length > 0);
    return (
        <div className="page year-page">
            <div className="year-bg" />
            <div className="year-inner">
                <PageHeader eyebrow="GLOBAL SPORTS FESTIVAL" title="역대 응원전" />

                {!hasCurrent && (
                    <SeasonPending
                        year={CURRENT_YEAR}
                        title={`${CURRENT_YEAR} 응원전`}
                        message="대회가 열리면 응원전 영상이 이곳에 올라옵니다."
                    />
                )}

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

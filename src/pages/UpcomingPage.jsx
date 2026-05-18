import PageHeader from '../components/PageHeader';
import { UPCOMING_FEATURES } from '../data';

const STATUS_COLORS = {
    '준비중': 'var(--bright)',
    '베타': 'var(--primary)',
    '예정': 'var(--accent)',
};

export default function UpcomingPage() {
    const gridFeatures = UPCOMING_FEATURES.filter((f) => f.key !== 'realtime');

    return (
        <div className="page upcoming-page">
            <div className="upcoming-inner">
                <PageHeader
                    eyebrow="PRE-OPEN"
                    title="곧 추가될 기능"
                    description="이 페이지는 사전 런칭 버전입니다. 본선까지 아래 기능들이 차례로 공개됩니다."
                />

                {/* 실시간 문자 중계 — 메인 스포트라이트 (맨 위 강조) */}
                <section className="upcoming-spotlight">
                    <div className="us-head">
                        <span className="us-badge">SPOTLIGHT</span>
                        <h3>실시간 문자 중계 (Play-by-Play)</h3>
                    </div>
                    <p>
                        본선 당일, NBA / KBL 스타일의 실시간 문자 중계 화면이 가동됩니다. 관리자가 점수와 코멘트를
                        입력하면 모든 관람객 화면이 1초 안에 자동으로 업데이트됩니다.
                    </p>
                    <ul className="us-checklist">
                        <li>· 상단 고정 스코어보드 (홈 / 어웨이)</li>
                        <li>· 쿼터 / 라운드 탭과 타임라인</li>
                        <li>· 득점·교체·반칙 등 액션별 아이콘 &amp; 컬러</li>
                        <li>· Supabase Realtime 기반 무새로고침 동기화</li>
                    </ul>
                    <div className="us-cta">기술 스택: React · Supabase Realtime · 실시간 구독</div>
                </section>

                {/* 나머지 예정 기능 */}
                <div className="upcoming-grid">
                    {gridFeatures.map((f) => (
                        <article key={f.key} className="upcoming-card">
                            <header className="uc-head">
                                <h3>{f.title}</h3>
                                <span
                                    className="uc-status"
                                    style={{ '--status-color': STATUS_COLORS[f.status] || 'var(--primary)' }}
                                >
                                    {f.status}
                                </span>
                            </header>
                            <p className="uc-desc">{f.desc}</p>
                        </article>
                    ))}
                </div>

                <section className="bg-split-demo" aria-hidden>
                    <div className="bg-split-left">문경</div>
                    <div className="bg-split-divider" />
                    <div className="bg-split-right">음성</div>
                    <span className="bg-split-caption">응원전 반반 배경 컨셉 · 운동장 세로선 기준</span>
                </section>
            </div>
        </div>
    );
}

import PageHeader from '../components/PageHeader';
import { SCHEDULE } from '../data';

function ScheduleBlock({ block, accent }) {
    const empty = !block.rounds || block.rounds.length === 0;
    return (
        <section className={`schedule-block ${empty ? 'is-empty' : ''}`} style={{ '--accent-color': accent }}>
            <header className="sb-header">
                <h3 className="sb-title">
                    <span className="sb-dot" />
                    {block.label}
                </h3>
                <div className="sb-meta">
                    <span className="sb-date">{block.dateRange}</span>
                    {block.kickOff && <span className="sb-kick">킥오프 {block.kickOff}</span>}
                </div>
            </header>
            <div className="sb-location">📍 {block.location}</div>

            {empty ? (
                <div className="sb-empty">
                    <div className="sb-empty-tag">COMING SOON</div>
                    <p>경기 일정이 확정되는 대로 이곳에 타임라인이 공개됩니다.</p>
                    <ul className="sb-empty-checklist">
                        <li>· 종목별 진행 위치 (음성/문경 캠퍼스)</li>
                        <li>· 시간대별 타임라인</li>
                        <li>· 라이브 중계 일정</li>
                    </ul>
                </div>
            ) : (
                <ol className="sb-timeline">
                    {block.rounds.map((r, i) => (
                        <li key={i} className="sb-round">
                            <span className="sb-time">{r.time}</span>
                            <span className="sb-event">{r.event}</span>
                            <span className="sb-loc">{r.location}</span>
                        </li>
                    ))}
                </ol>
            )}
        </section>
    );
}

export default function SchedulePage() {
    return (
        <div className="page schedule-page">
            <div className="schedule-inner">
                <PageHeader
                    eyebrow="GLOBAL SPORTS FESTIVAL"
                    title="경기 일정"
                    description="2026 글로벌 체육 축제 예선전과 본선 일정을 한눈에 확인하세요."
                />

                <div className="schedule-status-banner">
                    <span className="status-dot" />
                    <span>일정 확정 전 — 사전 공개 페이지입니다. 확정 후 자동으로 채워집니다.</span>
                </div>

                <div className="schedule-grid">
                    <ScheduleBlock block={SCHEDULE.preliminary} accent="var(--bright)" />
                    <ScheduleBlock block={SCHEDULE.finals} accent="var(--primary)" />
                </div>

                <section className="schedule-notes">
                    <h4>참고</h4>
                    <ul>
                        <li>예선은 음성 / 문경 캠퍼스에서 동시 진행될 예정입니다.</li>
                        <li>본선은 5월 30일(토) 단일 일정으로 진행됩니다.</li>
                        <li>일정과 장소가 변경될 수 있으며, 최종본은 사이트에서 공지됩니다.</li>
                    </ul>
                </section>
            </div>
        </div>
    );
}

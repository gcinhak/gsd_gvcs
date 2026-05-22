import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import CampusBadge from '../components/CampusBadge';
import { SCHEDULE } from '../data';

const DAY_ORDER = ['thursday', 'friday', 'saturday'];

/* 파란색에 흰색 반스푼 섞은 부드러운 파스텔톤 컬러 스타일 정의 */
const PILL_STYLES = {
    final: {
        backgroundColor: '#e0e7ff', // 부드러운 연파랑 (인디고 틴트)
        color: '#4338ca',           // 가독성을 위한 네이비-블루 글자색
        border: '1px solid #c7d2fe',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '600',
        display: 'inline-block'
    },
    prelim: {
        backgroundColor: '#f1f5f9', // 차분하고 부드러운 그레이-블루 틴트
        color: '#475569',           // 정돈된 글자색
        border: '1px solid #cbd5e1',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '600',
        display: 'inline-block'
    }
};

/* "문경 VS 음성" → 배지로 렌더 */
function renderMatch(text) {
    if (!text) return null;
    const parts = text.split(/\s*VS\s*/i);
    if (parts.length !== 2) return <span className="match-plain">{text}</span>;
    const [left, right] = parts.map((s) => s.trim());

    const renderSide = (side) => {
        const known = ['문경', '음성', '세종'].find((c) => side === c);
        if (known) return <CampusBadge campus={known} size="sm" />;
        return <span className="match-plain">{side}</span>;
    };

    return (
        <span className="match-pair">
            {renderSide(left)}
            <span className="match-vs">VS</span>
            {renderSide(right)}
        </span>
    );
}

function MatchTable({ matches }) {
    return (
        <div className="match-table-wrap">
            <table className="match-table">
                <thead>
                    <tr>
                        <th>경기</th>
                        <th>구분</th>
                        <th>대상</th>
                        <th>매치</th>
                    </tr>
                </thead>
                <tbody>
                    {matches.map((m, i) => (
                        <tr key={i} className={m.round === '결선' ? 'is-final' : ''}>
                            <td className="mt-num">{m.num}</td>
                            <td>
                                <span style={m.round === '결선' ? PILL_STYLES.final : PILL_STYLES.prelim}>
                                    {m.round}
                                </span>
                            </td>
                            <td className="mt-category">{m.category}</td>
                            <td className="mt-match">{renderMatch(m.match)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function TimelineList({ items }) {
    return (
        <ol className="timeline-list">
            {items.map((it, i) => (
                <li key={i} className={`timeline-row ${it.highlight ? 'is-highlight' : ''}`}>
                    <div className="tl-time">
                        <span className="tl-start">{it.start}</span>
                        <span className="tl-end">~ {it.end}</span>
                    </div>
                    <div className="tl-content">
                        {/* 배지를 텍스트(label) 내부로 이동시켜 위치를 맞추고, 높이(길이)가 길어지는 현상 방지 */}
                        <span className="tl-label">
                            {it.round && (
                                <span style={{ ... (it.round === '결선' ? PILL_STYLES.final : PILL_STYLES.prelim), marginRight: '6px', verticalAlign: 'middle' }}>
                                    {it.round}
                                </span>
                            )}
                            <span style={{ verticalAlign: 'middle' }}>{it.label}</span>
                        </span>
                        {it.sub && <span className="tl-sub">{renderMatch(it.sub)}</span>}
                    </div>
                    {it.meta && <span className="tl-meta">{it.meta}</span>}
                </li>
            ))}
        </ol>
    );
}

function CourtsTable({ courtNames, rows }) {
    return (
        <div className="courts-table-wrap">
            <table className="courts-table">
                <thead>
                    <tr>
                        <th>경기</th>
                        <th>시간</th>
                        {courtNames.map((n) => (
                            <th key={n}>{n}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r, i) => (
                        <tr key={i} className={r.isFinal ? 'is-final' : ''}>
                            <td className="ct-num">{r.num}</td>
                            <td className="ct-time">
                                <div>{r.start}</div>
                                <div className="ct-time-end">~ {r.end}</div>
                            </td>
                            {r.courts.map((c, ci) => (
                                <td key={ci} className={c ? 'ct-cell' : 'ct-cell ct-empty'}>
                                    {c ? (
                                        <>
                                            <div className="ct-category">
                                                {/* 배지를 텍스트 내부로 이동시켜 위치를 맞추고, 높이(길이)가 길어지는 현상 방지 */}
                                                {c.round && (
                                                    <span style={{ ... (c.round === '결선' ? PILL_STYLES.final : PILL_STYLES.prelim), marginRight: '4px', verticalAlign: 'middle' }}>
                                                        {c.round}
                                                    </span>
                                                )}
                                                <span style={{ verticalAlign: 'middle' }}>{c.category}</span>
                                            </div>
                                            <div className="ct-match">{renderMatch(c.match)}</div>
                                        </>
                                    ) : (
                                        <span className="ct-dash">—</span>
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function VenueSection({ venue }) {
    return (
        <section className="venue-section">
            <header className="venue-head">
                <h3 className="venue-name">📍 {venue.name}</h3>
                {venue.subtitle && <span className="venue-sub">{venue.subtitle}</span>}
            </header>

            {venue.kind === 'timeline' && <TimelineList items={venue.items} />}
            {venue.kind === 'courts' && <CourtsTable courtNames={venue.courtNames} rows={venue.rows} />}

            {venue.byes && venue.byes.length > 0 && (
                <div className="byes-note">
                    <span className="byes-label">부전승</span>
                    <span className="byes-items">{venue.byes.join(' · ')}</span>
                </div>
            )}
        </section>
    );
}

export default function SchedulePage() {
    const [activeDay, setActiveDay] = useState('thursday');
    const day = SCHEDULE[activeDay];

    return (
        <div className="page schedule-page">
            <div className="schedule-inner">
                <PageHeader
                    eyebrow="GLOBAL SPORTS FESTIVAL"
                    title="경기 일정"
                    description="2026년 5월 28일 ~ 30일 — 일자를 선택해 세부 일정을 확인하세요."
                />

                <div className="day-tabs">
                    {DAY_ORDER.map((key) => {
                        const d = SCHEDULE[key];
                        return (
                            <button
                                key={key}
                                className={`day-tab ${activeDay === key ? 'active' : ''}`}
                                onClick={() => setActiveDay(key)}
                            >
                                <span className="day-tab-emoji" aria-hidden>
                                    {d.emoji}
                                </span>
                                <span className="day-tab-text">
                                    <span className="day-tab-date">{d.shortDate}</span>
                                    <span className="day-tab-title">{d.title}</span>
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="day-hero">
                    <div className="day-hero-emoji">{day.emoji}</div>
                    <div>
                        <div className="day-hero-title">{day.title}</div>
                        <div className="day-hero-date">{day.date}</div>
                    </div>
                </div>

                {day.matches && <MatchTable matches={day.matches} />}

                {day.venues && (
                    <div className="venues-stack">
                        {day.venues.map((v, i) => (
                            <VenueSection key={i} venue={v} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
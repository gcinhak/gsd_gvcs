import { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import CampusBadge from '../components/CampusBadge';
import { HISTORY, CAMPUS_COLORS, EVENT_ORDER } from '../data';

function eventOrderIdx(name) {
    const idx = EVENT_ORDER.indexOf(name);
    return idx === -1 ? EVENT_ORDER.length : idx;
}

const TABS = [
    { key: 'events', label: '종목 결과' },
    { key: 'cheer', label: '응원전' },
];

function Tally({ items }) {
    const tally = useMemo(() => {
        const out = {};
        items.forEach((v) => {
            if (!v) return;
            out[v] = (out[v] || 0) + 1;
        });
        return Object.entries(out).sort((a, b) => b[1] - a[1]);
    }, [items]);

    if (tally.length === 0) return <span className="tally-empty">데이터 입력 대기중</span>;
    return (
        <div className="tally-row">
            {tally.map(([campus, count]) => (
                <span key={campus} className="tally-pill">
                    <CampusBadge campus={campus} size="sm" />
                    <strong>{count}회</strong>
                </span>
            ))}
        </div>
    );
}

function EventCard({ event }) {
    const [open, setOpen] = useState(false);
    const colors = CAMPUS_COLORS[event.winner];
    const hasDetails =
        (event.matches && event.matches.length > 0) ||
        (event.wins && event.wins.length > 0) ||
        event.finalScore ||
        event.note;

    const style = colors ? { '--card-tint': colors.soft, '--card-accent': colors.bg } : {};

    return (
        <article
            className={`event-card ${event.winner ? `winner-${event.winner.replace('/', '-')}` : ''}`}
            style={style}
        >
            <header className="ec-head">
                <h4 className="ec-name">{event.name}</h4>
                <CampusBadge campus={event.winner} size="md" />
            </header>

            {(event.finalScore || event.gameCount != null) && (
                <div className="ec-sub">
                    {event.finalScore && (
                        <span className="ec-final">
                            최종 <strong>{event.finalScore}</strong>
                        </span>
                    )}
                    {event.gameCount != null && <span className="ec-count">총 {event.gameCount}경기</span>}
                </div>
            )}

            {hasDetails && (
                <button className="ec-expand" onClick={() => setOpen((v) => !v)}>
                    {open ? '접기 ▲' : '상세 보기 ▼'}
                </button>
            )}

            {open && (
                <div className="ec-details">
                    {event.wins && event.wins.length > 0 && (
                        <div className="ec-wins">
                            {event.wins.map((w) => {
                                const isWinner = w.campus === event.winner;
                                const totalWins = event.wins.reduce((s, x) => s + (x.count || 0), 0);
                                return (
                                    <div key={w.campus} className={`win-row ${isWinner ? 'is-winner' : ''}`}>
                                        <CampusBadge campus={w.campus} size="sm" soft={!isWinner} />
                                        <div className="win-bar">
                                            <div
                                                className="win-bar-fill"
                                                style={{
                                                    width: totalWins ? `${(w.count / totalWins) * 100}%` : '0%',
                                                    background: CAMPUS_COLORS[w.campus]?.bg || '#374151',
                                                }}
                                            />
                                        </div>
                                        <span className="win-count">{w.count}승</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {event.matches && event.matches.length > 0 && (
                        <ul className="match-list">
                            {event.matches.map((m, i) => (
                                <li key={i} className="match-row">
                                    <span className="match-label">{m.label}</span>
                                    {m.score && <span className="match-score">{m.score}</span>}
                                    <CampusBadge campus={m.winner} size="sm" />
                                    {m.note && <span className="match-note">{m.note}</span>}
                                </li>
                            ))}
                        </ul>
                    )}

                    {event.note && <div className="ec-note">⚠ {event.note}</div>}
                </div>
            )}
        </article>
    );
}

function CheerBreakdown({ cheer }) {
    if (!cheer) return null;
    const hasScores = cheer.scores && cheer.scores.length > 0;
    const hasRankings = cheer.rankings && cheer.rankings.length > 0;
    const breakdownKeys = hasScores && cheer.scores[0]?.breakdown ? cheer.scores[0].breakdown.map((b) => b.name) : [];

    return (
        <div className="cheer-section">
            {hasScores && (
                <div className="score-table-wrap">
                    <table className="score-table">
                        <thead>
                            <tr>
                                <th>캠퍼스</th>
                                {breakdownKeys.map((k) => (
                                    <th key={k}>{k}</th>
                                ))}
                                <th>총점</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cheer.scores.map((s) => {
                                const isWinner = s.campus === cheer.winner;
                                return (
                                    <tr key={s.campus} className={isWinner ? 'is-winner' : ''}>
                                        <td>
                                            <CampusBadge campus={s.campus} size="sm" />
                                        </td>
                                        {breakdownKeys.length > 0
                                            ? breakdownKeys.map((k) => {
                                                  const v = s.breakdown?.find((b) => b.name === k);
                                                  return <td key={k}>{v ? v.value.toFixed(1) : '—'}</td>;
                                              })
                                            : null}
                                        <td className="total-cell">{s.total?.toFixed?.(1) ?? s.total}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {hasRankings && (
                <div className="cheer-rankings">
                    <h4>응원전 순위</h4>
                    <ol>
                        {cheer.rankings.map((r) => (
                            <li key={r.rank} className={`ranking-row rank-${r.rank}`}>
                                <span className="rank-num">{r.rank}</span>
                                <CampusBadge campus={r.campus} size="sm" />
                                <span className="rank-team">{r.team}</span>
                                <span className="rank-score">{r.score}</span>
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
}

export default function HistoryPage() {
    const [selectedYear, setSelectedYear] = useState(HISTORY[0].year);
    const [activeTab, setActiveTab] = useState('events');
    const yearData = HISTORY.find((h) => h.year === selectedYear);

    const overallItems = [
        ...HISTORY.map((h) => h.overall?.winner),
        // 과거 연도 누적분 (연도 데이터 없이 우승 기록만 반영)
        '문경',
        '문경',
        '문경',
        '문경', // +4회 → 문경 8회 합계
        '음성',
        '음성',
        '음성',
        '음성',
        '음성', // +5회 → 음성 6회 합계
    ];
    const cheerItems = HISTORY.map((h) => h.cheer?.winner);

    return (
        <div className="page history-page">
            <div className="history-inner">
                <PageHeader
                    eyebrow="GLOBAL SPORTS FESTIVAL"
                    title="역대 전적"
                    description="연도를 선택해 종합 우승, 응원전, 종목별 결과를 확인하세요."
                />

                <div className="year-pills">
                    {HISTORY.map((h) => (
                        <button
                            key={h.year}
                            className={`year-pill ${selectedYear === h.year ? 'active' : ''}`}
                            onClick={() => {
                                setSelectedYear(h.year);
                                setActiveTab('events');
                            }}
                        >
                            {h.year}
                        </button>
                    ))}
                </div>

                {yearData && (
                    <section className="year-hero">
                        <div className="yh-year-block">
                            <span className="yh-year-num">{yearData.year}</span>
                            <span className="yh-year-sub">글로벌 체육 축제</span>
                        </div>
                        <div className="yh-winners">
                            <div className="yh-winner">
                                <span className="yh-w-label">🏆 종합 우승</span>
                                {yearData.overall?.winner ? (
                                    <CampusBadge campus={yearData.overall.winner} size="lg" />
                                ) : (
                                    <span className="yh-w-empty">데이터 없음</span>
                                )}
                            </div>
                            <div className="yh-divider" aria-hidden />
                            <div className="yh-winner">
                                <span className="yh-w-label">📣 응원전 우승</span>
                                {yearData.cheer?.winner ? (
                                    <CampusBadge campus={yearData.cheer.winner} size="lg" />
                                ) : (
                                    <span className="yh-w-empty">데이터 없음</span>
                                )}
                            </div>
                        </div>
                        {(yearData.overall?.note || yearData.cheer?.note) && (
                            <div className="yh-notes">
                                {yearData.overall?.note && <span>· {yearData.overall.note}</span>}
                                {yearData.cheer?.note && <span>· {yearData.cheer.note}</span>}
                            </div>
                        )}
                    </section>
                )}

                <div className="sub-tabs">
                    {TABS.map((t) => {
                        const disabled = t.key === 'cheer' && !yearData?.cheer?.scores;
                        return (
                            <button
                                key={t.key}
                                className={`sub-tab ${activeTab === t.key ? 'active' : ''}`}
                                onClick={() => !disabled && setActiveTab(t.key)}
                                disabled={disabled}
                                title={disabled ? '응원전 상세 데이터 없음' : ''}
                            >
                                {t.label}
                                {t.key === 'events' && yearData?.events && (
                                    <span className="sub-tab-count">{yearData.events.length}</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {activeTab === 'events' && yearData?.events && (
                    <div className="events-grid">
                        {yearData.events
                            .slice()
                            .sort((a, b) => eventOrderIdx(a.name) - eventOrderIdx(b.name))
                            .map((e, i) => (
                                <EventCard key={`${selectedYear}-${e.name}-${i}`} event={e} />
                            ))}
                    </div>
                )}

                {activeTab === 'cheer' && yearData?.cheer && <CheerBreakdown cheer={yearData.cheer} />}

                {activeTab === 'events' && (!yearData?.events || yearData.events.length === 0) && (
                    <div className="empty-state">
                        <div className="empty-tag">데이터 없음</div>
                        <p>이 연도의 종목별 결과 데이터가 아직 없습니다.</p>
                    </div>
                )}

                <section className="history-summary">
                    <div className="hs-card">
                        <div className="hs-label">📊 종합 우승 누적</div>
                        <Tally items={overallItems} />
                    </div>
                    <div className="hs-card">
                        <div className="hs-label">📣 응원전 승리 누적</div>
                        <Tally items={cheerItems} />
                    </div>
                </section>
            </div>
        </div>
    );
}

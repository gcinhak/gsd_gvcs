import { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import CampusBadge from '../components/CampusBadge';
import { getCampusList, getSports, getCategories, getPlayers, hasCampusData } from '../data/lineup';
import { CAMPUS_COLORS } from '../data';

function PlayerRow({ player }) {
    return (
        <li className={`lp-row ${player.bench ? 'is-bench' : ''}`}>
            {player.no != null && <span className="lp-num">{player.no}</span>}
            {player.grade != null && <span className="lp-grade">{player.grade}</span>}
            <span className="lp-name">{player.name}</span>
            {player.role && <span className="lp-role">{player.role}</span>}
            {player.bench && <span className="lp-bench-tag">후보</span>}
            {player.alt && <span className="lp-alt">{player.alt}</span>}
        </li>
    );
}

function CategoryCard({ campus, category, players }) {
    const color = CAMPUS_COLORS[campus];
    const cardStyle = color ? { '--card-tint': color.soft, '--card-accent': color.bg } : {};
    const starters = players.filter((p) => !p.bench);
    const bench = players.filter((p) => p.bench);

    return (
        <article className="lp-card" style={cardStyle}>
            <header className="lp-card-head">
                <h3 className="lp-card-title">{category}</h3>
                <span className="lp-card-count">
                    {starters.length}
                    {bench.length > 0 && <span className="lp-bench-count"> · 후보 {bench.length}</span>}
                </span>
            </header>
            {players.length === 0 ? (
                <div className="lp-empty">선수 미입력</div>
            ) : (
                <ul className="lp-list">
                    {starters.map((p, i) => (
                        <PlayerRow key={`s-${i}`} player={p} />
                    ))}
                    {bench.length > 0 && <li className="lp-divider">후보</li>}
                    {bench.map((p, i) => (
                        <PlayerRow key={`b-${i}`} player={p} />
                    ))}
                </ul>
            )}
        </article>
    );
}

export default function LineupPage() {
    const campuses = getCampusList();
    const [campus, setCampus] = useState(
        campuses.find((c) => hasCampusData(c)) || campuses[0]
    );
    const sports = useMemo(() => getSports(campus), [campus]);
    const [sport, setSport] = useState(sports[0] || '');

    // 캠퍼스 바뀌면 sport 도 재선택
    const visibleSports = sports;
    const activeSport = visibleSports.includes(sport) ? sport : visibleSports[0];
    const categories = activeSport ? getCategories(campus, activeSport) : [];

    const isEmpty = !hasCampusData(campus);

    return (
        <div className="page lineup-page">
            <div className="lineup-inner">
                <PageHeader
                    eyebrow="GLOBAL SPORTS FESTIVAL"
                    title="라인업"
                    description="캠퍼스 · 종목별 출전 선수를 확인하세요."
                />

                {/* 캠퍼스 탭 */}
                <div className="lp-campus-tabs">
                    {campuses.map((c) => {
                        const enabled = hasCampusData(c);
                        return (
                            <button
                                key={c}
                                type="button"
                                className={`lp-campus-tab ${campus === c ? 'active' : ''} ${enabled ? '' : 'is-disabled'}`}
                                onClick={() => enabled && setCampus(c)}
                                disabled={!enabled}
                            >
                                <CampusBadge campus={c} size="md" />
                                {!enabled && <span className="lp-disabled-tag">준비중</span>}
                            </button>
                        );
                    })}
                </div>

                {isEmpty ? (
                    <div className="empty-state">
                        <div className="empty-tag">라인업 준비중</div>
                        <p>이 캠퍼스의 라인업 데이터가 아직 등록되지 않았습니다.</p>
                    </div>
                ) : (
                    <>
                        {/* 종목 칩 */}
                        <div className="lp-sport-chips">
                            {visibleSports.map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    className={`chip ${activeSport === s ? 'active' : ''}`}
                                    onClick={() => setSport(s)}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>

                        {/* 카테고리 카드 그리드 */}
                        <div className="lp-grid">
                            {categories.map((cat) => (
                                <CategoryCard
                                    key={cat}
                                    campus={campus}
                                    category={cat}
                                    players={getPlayers(campus, activeSport, cat)}
                                />
                            ))}
                            {categories.length === 0 && (
                                <div className="empty-state">
                                    <div className="empty-tag">데이터 없음</div>
                                    <p>이 종목의 라인업이 아직 없습니다.</p>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* 도움말 */}
                <div className="lp-help">
                    <span>
                        ⓘ 음성·세종 캠퍼스 라인업이 등록되면 자동으로 탭이 활성화됩니다. (현재 문경 데이터만 입력)
                    </span>
                </div>

            </div>
        </div>
    );
}

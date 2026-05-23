import { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import CampusBadge from '../components/CampusBadge';
import {
    getCampusList,
    getPlayers,
    getAllSports,
    getAllCategoriesForSport,
} from '../data/lineup';
import { CAMPUS_COLORS } from '../data';

const CAMPUS_FILTER_ALL = '__all';

function PlayerRow({ player }) {
    return (
        <li className={`lp-row ${player.bench ? 'is-bench' : ''}`}>
            {player.grade != null && <span className="lp-grade">{player.grade}</span>}
            <span className="lp-name">{player.name}</span>
            {player.role && <span className="lp-role">{player.role}</span>}
            {player.bench && <span className="lp-bench-tag">후보</span>}
            {player.alt && <span className="lp-alt">{player.alt}</span>}
        </li>
    );
}

function sortByGrade(players) {
    // 학년 높은 순(12 → 7), 학년 없는 인원은 맨 아래
    return players.slice().sort((a, b) => {
        const ga = a.grade ?? -Infinity;
        const gb = b.grade ?? -Infinity;
        return gb - ga;
    });
}

function CampusCategoryCard({ campus, sport, category, multiCol }) {
    const players = getPlayers(campus, sport, category);
    const color = CAMPUS_COLORS[campus];
    const cardStyle = color ? { '--card-tint': color.soft, '--card-accent': color.bg } : {};
    const starters = sortByGrade(players.filter((p) => !p.bench));
    const bench = sortByGrade(players.filter((p) => p.bench));
    const isEmpty = players.length === 0;
    const listClass = `lp-list${multiCol ? ' is-multi-col' : ''}`;

    return (
        <article className={`lp-card ${isEmpty ? 'is-empty' : ''}`} style={cardStyle}>
            <header className="lp-card-head">
                <CampusBadge campus={campus} size="md" />
                <span className="lp-card-count">
                    {isEmpty ? '미입력' : `${starters.length}명${bench.length > 0 ? ` · 후보 ${bench.length}` : ''}`}
                </span>
            </header>
            {isEmpty ? (
                <div className="lp-empty">선수 데이터 입력 대기중</div>
            ) : (
                <ul className={listClass}>
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
    const sports = useMemo(() => getAllSports(), []);
    const campuses = getCampusList();

    const [sport, setSport] = useState(sports[0] || '');
    const categories = useMemo(() => getAllCategoriesForSport(sport), [sport]);
    const [category, setCategory] = useState(categories[0] || '');
    const [campusFilter, setCampusFilter] = useState(CAMPUS_FILTER_ALL);

    // 종목 바뀌면 카테고리도 첫번째로
    const activeCategory = categories.includes(category) ? category : categories[0] || '';

    const visibleCampuses = campusFilter === CAMPUS_FILTER_ALL
        ? campuses
        : [campusFilter];

    return (
        <div className="page lineup-page">
            <div className="lineup-inner">
                <PageHeader
                    eyebrow="GLOBAL SPORTS FESTIVAL"
                    title="라인업"
                    description="종목 → 카테고리 순으로 선택하고, 원하는 캠퍼스만 골라 보세요."
                />

                {/* 종목 탭 */}
                <div className="lp-sport-tabs">
                    {sports.map((s) => (
                        <button
                            key={s}
                            type="button"
                            className={`lp-sport-tab ${sport === s ? 'active' : ''}`}
                            onClick={() => setSport(s)}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                {/* 카테고리 칩 */}
                {categories.length > 0 && (
                    <div className="lp-cat-chips">
                        {categories.map((c) => (
                            <button
                                key={c}
                                type="button"
                                className={`chip ${activeCategory === c ? 'active' : ''}`}
                                onClick={() => setCategory(c)}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                )}

                {/* 캠퍼스 필터 */}
                <div className="lp-campus-filter">
                    <span className="lp-filter-label">캠퍼스</span>
                    <div className="lp-campus-pills">
                        <button
                            type="button"
                            className={`lp-campus-pill is-all ${campusFilter === CAMPUS_FILTER_ALL ? 'active' : ''}`}
                            onClick={() => setCampusFilter(CAMPUS_FILTER_ALL)}
                        >
                            전체
                        </button>
                        {campuses.map((c) => {
                            const cc = CAMPUS_COLORS[c] || {};
                            const active = campusFilter === c;
                            const style = active
                                ? { background: cc.bg, color: '#fff', borderColor: cc.bg }
                                : { background: cc.soft, color: cc.bg, borderColor: cc.bg };
                            return (
                                <button
                                    key={c}
                                    type="button"
                                    className={`lp-campus-pill is-campus ${active ? 'active' : ''}`}
                                    style={style}
                                    onClick={() => setCampusFilter(c)}
                                >
                                    {c}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 캠퍼스 카드: 단일 vs 그리드 — 완전 다른 래퍼로 분기 */}
                {activeCategory ? (
                    campusFilter !== CAMPUS_FILTER_ALL ? (
                        <div className="lp-single">
                            <CampusCategoryCard
                                key={campusFilter}
                                campus={campusFilter}
                                sport={sport}
                                category={activeCategory}
                                multiCol
                            />
                        </div>
                    ) : (
                        <div className="lp-grid">
                            {visibleCampuses.map((campus) => (
                                <CampusCategoryCard
                                    key={campus}
                                    campus={campus}
                                    sport={sport}
                                    category={activeCategory}
                                />
                            ))}
                        </div>
                    )
                ) : (
                    <div className="empty-state">
                        <div className="empty-tag">카테고리 없음</div>
                        <p>이 종목의 카테고리가 아직 등록되지 않았습니다.</p>
                    </div>
                )}

                <div className="lp-help">
                    <span>ⓘ 음성·세종 라인업 데이터가 입력되면 해당 캠퍼스 카드에 자동으로 표시됩니다.</span>
                </div>
            </div>
        </div>
    );
}

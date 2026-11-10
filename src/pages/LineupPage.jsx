import { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import CampusBadge from '../components/CampusBadge';
import { ArchiveSection, SeasonPending, SeasonTitle } from '../components/SeasonBlocks';
import {
    LINEUP,
    LINEUP_2027,
    getCampusList,
    getPlayers,
    getAllSports,
    getAllCategoriesForSport,
    hasAnyPlayers,
} from '../data/lineup';
import { CAMPUS_COLORS } from '../data/data';
import { maskName } from '../lib/maskName';

const CAMPUS_FILTER_ALL = '__all';

function PlayerRow({ player }) {
    // label 항목이면 섹션 헤더로 렌더링
    if (player.label) {
        return <li className="lp-row-label">{player.label}</li>;
    }

    return (
        <li className="lp-row">
            {player.grade != null && <span className="lp-grade">{player.grade}</span>}
            <span className="lp-name">{maskName(player.name)}</span>
            {player.alt && <span className="lp-alt">{player.alt}</span>}
            {player.role && <span className="lp-role">{player.role}</span>}
        </li>
    );
}

function sortByGrade(players) {
    // label 항목은 정렬하지 않고 원래 순서 유지
    if (players.some((p) => p.label)) return players;
    return players.slice().sort((a, b) => {
        const ga = a.grade ?? -Infinity;
        const gb = b.grade ?? -Infinity;
        return gb - ga;
    });
}

function CampusCategoryCard({ lineup, campus, sport, category, multiCol }) {
    const players = getPlayers(campus, sport, category, lineup);
    const color = CAMPUS_COLORS[campus];
    const cardStyle = color ? { '--card-tint': color.soft, '--card-accent': color.bg } : {};
    const allPlayers = sortByGrade(players);
    const isEmpty = players.length === 0;
    const listClass = `lp-list${multiCol ? ' is-multi-col' : ''}`;

    return (
        <article className={`lp-card ${isEmpty ? 'is-empty' : ''}`} style={cardStyle}>
            <header className="lp-card-head">
                <CampusBadge campus={campus} size="md" />
                <span className="lp-card-count">{isEmpty ? '미입력' : `${allPlayers.length}명`}</span>
            </header>
            {isEmpty ? (
                <div className="lp-empty">선수 데이터 입력 대기중</div>
            ) : (
                <ul className={listClass}>
                    {allPlayers.map((p, i) => (
                        <PlayerRow key={i} player={p} />
                    ))}
                </ul>
            )}
        </article>
    );
}

/** 종목 → 카테고리 → 캠퍼스 순으로 라인업을 고르는 화면. 연도별 라인업 객체를 받는다. */
function LineupBrowser({ lineup, showHelp = false }) {
    const sports = useMemo(() => getAllSports(lineup), [lineup]);
    const campuses = getCampusList();

    const [sport, setSport] = useState(sports[0] || '');
    const categories = useMemo(() => getAllCategoriesForSport(sport, lineup), [sport, lineup]);
    const [category, setCategory] = useState(categories[0] || '');
    const [campusFilter, setCampusFilter] = useState(CAMPUS_FILTER_ALL);

    // 종목 바뀌면 카테고리도 첫번째로
    const activeCategory = categories.includes(category) ? category : categories[0] || '';

    const visibleCampuses = campusFilter === CAMPUS_FILTER_ALL ? campuses : [campusFilter];

    return (
        <>
            {/* 종목 탭 */}
            <div className="lp-sport-tabs">
                {sports.map((s) => (
                    <button
                        key={s}
                        type="button"
                        className={`lp-sport-tab ${sport === s ? 'active' : ''}`}
                        onClick={() => {
                            setSport(s); // 1. 누른 종목으로 변경
                            const newCategories = getAllCategoriesForSport(s, lineup); // 2. 바뀐 종목의 카테고리 목록 불러오기
                            setCategory(newCategories[0] || ''); // 3. 무조건 첫 번째 카테고리로 덮어쓰기
                        }}
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
                            lineup={lineup}
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
                                lineup={lineup}
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

            {showHelp && (
                <div className="lp-help">
                    <span>ⓘ 캠퍼스별 라인업 데이터가 입력되면 해당 캠퍼스 카드에 자동으로 표시됩니다.</span>
                </div>
            )}
        </>
    );
}

export default function LineupPage() {
    const has2027 = hasAnyPlayers(LINEUP_2027);
    return (
        <div className="page lineup-page">
            <div className="lineup-inner">
                <PageHeader eyebrow="GLOBAL SPORTS FESTIVAL" title="라인업" />

                {has2027 ? (
                    <section className="season-block">
                        <SeasonTitle year={2027} title="라인업" />
                        <LineupBrowser lineup={LINEUP_2027} showHelp />
                    </section>
                ) : (
                    <SeasonPending
                        year={2027}
                        title="2027 라인업"
                        message="캠퍼스별 선수 명단이 확정되면 이곳에 공개됩니다."
                    />
                )}

                <ArchiveSection year={2026} title="라인업">
                    <LineupBrowser lineup={LINEUP} />
                </ArchiveSection>
            </div>
        </div>
    );
}

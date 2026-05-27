import { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { EVENTS, GAME_VIDEOS, YEARS } from '../data/data';

const ROUNDS = [
    { key: 'all', label: '전체' },
    { key: 'preliminary', label: '예선' },
    { key: 'final', label: '본선' },
];

export default function GamesPage() {
    const years = useMemo(() => YEARS.map((y) => y.year), []);
    const [year, setYear] = useState(years[0]);
    const [eventKey, setEventKey] = useState('all');
    const [round, setRound] = useState('all');
    const [playing, setPlaying] = useState(null);

    const filtered = useMemo(() => {
        return GAME_VIDEOS.filter((g) => {
            if (g.year !== year) return false;
            if (eventKey !== 'all' && g.event !== eventKey) return false;
            if (round !== 'all' && g.round !== round) return false;
            return true;
        });
    }, [year, eventKey, round]);

    const eventName = (key) => EVENTS.find((e) => e.key === key)?.name || key;
    const eventEmoji = (key) => EVENTS.find((e) => e.key === key)?.emoji || '🎽';

    return (
        <div className="page games-page">
            <div className="games-inner">
                <PageHeader eyebrow="GLOBAL SPORTS FESTIVAL" title="종목별 경기 영상" />

                <div className="filter-bar">
                    <div className="filter-group">
                        <span className="filter-label">연도</span>
                        <div className="filter-chips">
                            {years.map((y) => (
                                <button
                                    key={y}
                                    className={`chip ${year === y ? 'active' : ''}`}
                                    onClick={() => {
                                        setYear(y);
                                        setPlaying(null);
                                    }}
                                >
                                    {y}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="filter-group">
                        <span className="filter-label">종목</span>
                        <div className="filter-chips">
                            <button
                                className={`chip ${eventKey === 'all' ? 'active' : ''}`}
                                onClick={() => {
                                    setEventKey('all');
                                    setPlaying(null);
                                }}
                            >
                                전체
                            </button>
                            {EVENTS.map((e) => (
                                <button
                                    key={e.key}
                                    className={`chip ${eventKey === e.key ? 'active' : ''}`}
                                    onClick={() => {
                                        setEventKey(e.key);
                                        setPlaying(null);
                                    }}
                                >
                                    <span aria-hidden>{e.emoji}</span> {e.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="filter-group">
                        <span className="filter-label">라운드</span>
                        <div className="filter-chips">
                            {ROUNDS.map((r) => (
                                <button
                                    key={r.key}
                                    className={`chip ${round === r.key ? 'active' : ''}`}
                                    onClick={() => {
                                        setRound(r.key);
                                        setPlaying(null);
                                    }}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {playing && playing.videoId ? (
                    <div className="player-wrap">
                        <div className="player-frame">
                            <iframe
                                src={`https://www.youtube.com/embed/${playing.videoId}?autoplay=1&rel=0&modestbranding=1`}
                                title={playing.label}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                            <div className="player-watermark">
                                <span>made by Sync </span>
                            </div>
                        </div>
                        <button className="close-player" onClick={() => setPlaying(null)}>
                            ✕ 목록으로
                        </button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-tag">선택한 조건에 해당하는 영상이 아직 없어요</div>
                        <p>경기가 끝나는 대로 영상이 업로드됩니다.</p>
                    </div>
                ) : (
                    <div className="game-grid">
                        {filtered.map((g, i) => {
                            const has = !!g.videoId;
                            return (
                                <button
                                    key={`${g.year}-${g.event}-${g.round}-${i}`}
                                    className={`game-card ${has ? '' : 'placeholder'}`}
                                    onClick={() => has && setPlaying(g)}
                                    disabled={!has}
                                >
                                    <div className="game-thumb">
                                        {has ? (
                                            <>
                                                <img
                                                    src={`https://img.youtube.com/vi/${g.videoId}/hqdefault.jpg`}
                                                    alt={g.label}
                                                />
                                                <div className="thumb-overlay">
                                                    <div className="play-btn">▶</div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="thumb-placeholder">
                                                <span aria-hidden>{eventEmoji(g.event)}</span>
                                                <span>Coming Soon</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="game-info">
                                        <div className="game-tags">
                                            <span className="tag tag-year">{g.year}</span>
                                            <span className="tag tag-event">
                                                {eventEmoji(g.event)} {eventName(g.event)}
                                            </span>
                                            <span className={`tag tag-round tag-round-${g.round}`}>
                                                {g.round === 'final' ? '본선' : '예선'}
                                            </span>
                                        </div>
                                        <div className="game-label">{g.label}</div>
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

import { useEffect, useRef, useState } from 'react';
import PageHeader from '../components/PageHeader';
import CampusBadge from '../components/CampusBadge';
import { CAMPUS_COLORS } from '../data';

const STORAGE_KEY = 'gsd-popcat-counts-v2';
const CAMPUSES = ['문경', '음성', '세종'];

function readStored() {
    if (typeof window === 'undefined') return { 문경: 0, 음성: 0, 세종: 0 };
    try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
        return CAMPUSES.reduce((acc, c) => {
            acc[c] = Number(parsed[c]) || 0;
            return acc;
        }, {});
    } catch {
        return { 문경: 0, 음성: 0, 세종: 0 };
    }
}

export default function PopcatPage() {
    const [counts, setCounts] = useState(readStored);
    const [openCampus, setOpenCampus] = useState(null);
    const [pops, setPops] = useState([]);
    const popIdRef = useRef(0);
    const releaseTimers = useRef({});

    useEffect(() => {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(counts));
    }, [counts]);

    const press = (campus) => {
        setOpenCampus(campus);
        setCounts((c) => ({ ...c, [campus]: (c[campus] || 0) + 1 }));
        const id = popIdRef.current++;
        setPops((prev) => [...prev, { id, campus, x: 40 + Math.random() * 20 }]);
        setTimeout(() => {
            setPops((prev) => prev.filter((p) => p.id !== id));
        }, 900);
        clearTimeout(releaseTimers.current[campus]);
        releaseTimers.current[campus] = setTimeout(() => {
            setOpenCampus((cur) => (cur === campus ? null : cur));
        }, 140);
    };

    const reset = () => {
        if (!window.confirm('모든 캠퍼스의 카운트를 초기화할까요?')) return;
        setCounts({ 문경: 0, 음성: 0, 세종: 0 });
    };

    const total = CAMPUSES.reduce((s, c) => s + (counts[c] || 0), 0);
    const ranked = [...CAMPUSES].sort((a, b) => (counts[b] || 0) - (counts[a] || 0));
    const leader = ranked[0];
    const leaderCount = counts[leader] || 0;
    const isTied = total > 0 && ranked.every((c) => counts[c] === leaderCount);

    return (
        <div className="page popcat-page">
            <div className="popcat-inner">
                <PageHeader
                    eyebrow="POPCAT · BETA"
                    title="캠퍼스 대결 응원 카운터"
                    description="문경 · 음성 · 세종 — 가장 많이 응원한 캠퍼스가 이깁니다."
                />

                {/* Scoreboard */}
                <section className="pop-board">
                    <div className="pb-head">
                        <span className="pb-title">실시간 랭킹</span>
                        <span className="pb-total">총 {total.toLocaleString()} POPS</span>
                    </div>
                    <div className="pb-rows">
                        {ranked.map((campus, idx) => {
                            const count = counts[campus] || 0;
                            const pct = total > 0 ? (count / total) * 100 : 0;
                            const isLeader = idx === 0 && total > 0 && !isTied;
                            const color = CAMPUS_COLORS[campus];
                            return (
                                <div key={campus} className={`pb-row ${isLeader ? 'is-leader' : ''}`}>
                                    <div className="pb-rank">{total > 0 && !isTied ? idx + 1 : '—'}</div>
                                    <CampusBadge campus={campus} size="md" />
                                    <div className="pb-bar">
                                        <div
                                            className="pb-bar-fill"
                                            style={{ width: `${pct}%`, background: color?.bg }}
                                        />
                                    </div>
                                    <div className="pb-count">
                                        <span className="pb-count-num">{count.toLocaleString()}</span>
                                        <span className="pb-count-pct">{pct.toFixed(1)}%</span>
                                    </div>
                                    {isLeader && <span className="pb-crown" aria-hidden>👑</span>}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Battle Buttons */}
                <section className="pop-battle">
                    {CAMPUSES.map((campus) => {
                        const color = CAMPUS_COLORS[campus];
                        const isOpen = openCampus === campus;
                        const campusPops = pops.filter((p) => p.campus === campus);
                        return (
                            <button
                                key={campus}
                                className={`pop-btn ${isOpen ? 'open' : ''}`}
                                style={{
                                    '--btn-bg': color?.bg,
                                    '--btn-soft': color?.soft,
                                }}
                                onMouseDown={() => press(campus)}
                                onTouchStart={(e) => { e.preventDefault(); press(campus); }}
                                aria-label={`${campus} 캠퍼스 응원하기`}
                            >
                                <span className="pop-btn-name">{campus}</span>
                                <span className="pop-btn-face" aria-hidden>{isOpen ? '😮' : '😺'}</span>
                                <span className="pop-btn-count">{(counts[campus] || 0).toLocaleString()}</span>
                                <span className="pop-btn-hint">{isOpen ? 'POP!' : '터치 / 클릭'}</span>
                                {campusPops.map((p) => (
                                    <span key={p.id} className="pop-floater" style={{ left: `${p.x}%` }}>
                                        +1
                                    </span>
                                ))}
                            </button>
                        );
                    })}
                </section>

                <div className="pop-actions">
                    <button className="popcat-reset" onClick={reset}>
                        🔄 전체 초기화
                    </button>
                    <span className="pop-hint-text">카운트는 이 브라우저에 저장됩니다.</span>
                </div>
            </div>
        </div>
    );
}

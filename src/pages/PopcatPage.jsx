import { useEffect, useRef, useState } from 'react';
import PageHeader from '../components/PageHeader';
import CampusBadge from '../components/CampusBadge';
import { CAMPUS_COLORS } from '../data';
import { fetchCounts, incrementCount, isPopcatApiConfigured } from '../lib/popcatApi';

const LOCAL_STORAGE_KEY = 'gsd-popcat-counts-v2';
const CAMPUSES = ['문경', '음성', '세종'];
const POLL_MS = 30000; // 서버 폴링 간격 (요청 부하 완화 위해 1500 → 30000)
const FLUSH_MS = 20000; // 클릭 누적 배치 전송 간격 (20초)
const IS_DISABLED = false; // 응급 비활성화 토글 — true 로 바꾸면 클릭 막힘

const ZERO = { 문경: 0, 음성: 0, 세종: 0 };

function readLocal() {
    if (typeof window === 'undefined') return { ...ZERO };
    try {
        const parsed = JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
        return CAMPUSES.reduce((acc, c) => {
            acc[c] = Number(parsed[c]) || 0;
            return acc;
        }, {});
    } catch {
        return { ...ZERO };
    }
}

export default function PopcatPage() {
    const [counts, setCounts] = useState(() => (isPopcatApiConfigured ? { ...ZERO } : readLocal()));
    const [openCampus, setOpenCampus] = useState(null);
    const [pops, setPops] = useState([]);
    const [serverState, setServerState] = useState(isPopcatApiConfigured ? 'connecting' : 'offline');
    const [pendingTotal, setPendingTotal] = useState(0);

    const popIdRef = useRef(0);
    const releaseTimers = useRef({});
    const pendingRef = useRef({ ...ZERO });
    const flushTimerRef = useRef(null);
    const schedulerRef = useRef(() => {});

    /* localStorage 캐시 (로컬모드 한정) */
    useEffect(() => {
        if (isPopcatApiConfigured) return;
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(counts));
    }, [counts]);

    /* 20초 배치 플러시 — flush 와 scheduler 가 같은 클로저 안에서 작동 */
    useEffect(() => {
        if (!isPopcatApiConfigured) {
            schedulerRef.current = () => {};
            return;
        }

        const flush = async () => {
            const toSend = { ...pendingRef.current };
            pendingRef.current = { ...ZERO };
            setPendingTotal(0);

            for (const c of CAMPUSES) {
                const delta = toSend[c];
                if (delta > 0) {
                    try {
                        await incrementCount(c, delta);
                    } catch {
                        pendingRef.current[c] += delta;
                    }
                }
            }

            const remaining = CAMPUSES.reduce((s, c) => s + pendingRef.current[c], 0);
            setPendingTotal(remaining);
            if (remaining > 0) {
                flushTimerRef.current = setTimeout(flush, FLUSH_MS);
            }
        };

        schedulerRef.current = () => {
            if (flushTimerRef.current) return;
            flushTimerRef.current = setTimeout(() => {
                flushTimerRef.current = null;
                flush();
            }, FLUSH_MS);
        };

        return () => {
            if (flushTimerRef.current) {
                clearTimeout(flushTimerRef.current);
                flushTimerRef.current = null;
            }
        };
    }, []);

    /* 페이지 이탈 시 마지막 저장 시도 (keepalive fetch) */
    useEffect(() => {
        if (!isPopcatApiConfigured) return;

        const sendBeacon = () => {
            const pending = pendingRef.current;
            const url =
                (import.meta.env.VITE_POPCAT_API_URL || 'https://gsd-gvcs-popcat.gcinhak.workers.dev').replace(
                    /\/$/,
                    ''
                ) + '/api/popcat/increment';
            for (const c of CAMPUSES) {
                if (pending[c] > 0) {
                    try {
                        fetch(url, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ campus: c, delta: pending[c] }),
                            keepalive: true,
                        });
                    } catch {
                        /* ignore */
                    }
                }
            }
            pendingRef.current = { ...ZERO };
        };

        window.addEventListener('beforeunload', sendBeacon);
        window.addEventListener('pagehide', sendBeacon);
        return () => {
            window.removeEventListener('beforeunload', sendBeacon);
            window.removeEventListener('pagehide', sendBeacon);
            sendBeacon();
        };
    }, []);

    /* 서버 폴링 — 백그라운드 탭 차단 + 30초 간격으로 요청 최소화 */
    useEffect(() => {
        if (!isPopcatApiConfigured) return;
        let cancelled = false;

        const pull = async () => {
            if (document.visibilityState !== 'visible') return; // 백그라운드면 스킵
            try {
                const remote = await fetchCounts();
                if (cancelled) return;
                setCounts((local) => {
                    const merged = { ...local };
                    for (const c of CAMPUSES) {
                        merged[c] = Math.max(Number(local[c]) || 0, Number(remote[c]) || 0);
                    }
                    return merged;
                });
                setServerState('online');
            } catch {
                if (!cancelled) setServerState('error');
            }
        };

        // 탭이 다시 보일 때 즉시 한 번 갱신
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') pull();
        };

        pull();
        const timer = setInterval(pull, POLL_MS);
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            cancelled = true;
            clearInterval(timer);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, []);

    const press = (campus) => {
        if (IS_DISABLED) return;
        setOpenCampus(campus);
        setCounts((c) => ({ ...c, [campus]: (c[campus] || 0) + 1 }));

        // 누적치에 추가 + 다음 flush 예약
        pendingRef.current[campus] = (pendingRef.current[campus] || 0) + 1;
        setPendingTotal((p) => p + 1);
        schedulerRef.current();

        const id = popIdRef.current++;
        setPops((prev) => [...prev, { id, campus, x: 40 + Math.random() * 20 }]);
        setTimeout(() => setPops((prev) => prev.filter((p) => p.id !== id)), 900);

        clearTimeout(releaseTimers.current[campus]);
        releaseTimers.current[campus] = setTimeout(() => {
            setOpenCampus((cur) => (cur === campus ? null : cur));
        }, 140);
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

                <section className="pop-board">
                    <div className="pb-head">
                        <span className="pb-title">실시간 랭킹</span>
                        <div className="pb-meta">
                            <ServerIndicator state={serverState} pendingTotal={pendingTotal} />
                            <span className="pb-total">총 {total.toLocaleString()} POPS</span>
                        </div>
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
                                    {isLeader && (
                                        <span className="pb-crown" aria-hidden>
                                            👑
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="pop-battle">
                    {CAMPUSES.map((campus) => {
                        const color = CAMPUS_COLORS[campus];
                        const isOpen = openCampus === campus;
                        const campusPops = pops.filter((p) => p.campus === campus);
                        return (
                            <button
                                key={campus}
                                className={`pop-btn ${isOpen ? 'open' : ''} ${IS_DISABLED ? 'disabled' : ''}`}
                                disabled={IS_DISABLED}
                                style={{
                                    '--btn-bg': color?.bg,
                                    '--btn-soft': color?.soft,
                                    opacity: IS_DISABLED ? 0.45 : 1,
                                    cursor: IS_DISABLED ? 'not-allowed' : 'pointer',
                                    filter: IS_DISABLED ? 'grayscale(60%)' : 'none',
                                }}
                                onMouseDown={() => press(campus)}
                                onTouchStart={(e) => {
                                    e.preventDefault();
                                    press(campus);
                                }}
                                aria-label={`${campus} 캠퍼스 응원하기`}
                            >
                                <span className="pop-btn-name">{campus}</span>
                                <span className="pop-btn-face" aria-hidden>
                                    {isOpen ? '😮' : '😺'}
                                </span>
                                <span className="pop-btn-count">{(counts[campus] || 0).toLocaleString()}</span>
                                <span className="pop-btn-hint">
                                    {IS_DISABLED ? '잠시 점검중' : isOpen ? 'POP!' : '터치 / 클릭'}
                                </span>
                                {campusPops.map((p) => (
                                    <span key={p.id} className="pop-floater" style={{ left: `${p.x}%` }}>
                                        +1
                                    </span>
                                ))}
                            </button>
                        );
                    })}
                </section>
            </div>
        </div>
    );
}

function ServerIndicator({ state, pendingTotal }) {
    const map = {
        online: { dot: '#10b981', text: '서버 연결됨' },
        connecting: { dot: '#f59e0b', text: '연결중' },
        error: { dot: '#dc2626', text: '서버 연결 실패' },
        offline: { dot: '#9ca3af', text: '로컬 모드' },
    };
    const cur = map[state] || map.offline;
    const hasPending = pendingTotal > 0 && state !== 'offline';
    return (
        <span className="server-indicator" title={hasPending ? `${pendingTotal}회 곧 저장` : ''}>
            <span className="si-dot" style={{ background: cur.dot }} />
            <span className="si-text">
                {cur.text}
                {hasPending && <span className="si-pending"> · 곧 저장 {pendingTotal}</span>}
            </span>
        </span>
    );
}

import { useEffect, useRef, useState } from 'react';
import PageHeader from '../components/PageHeader';
import CampusBadge from '../components/CampusBadge';
import { CAMPUS_COLORS } from '../data';
import { fetchCounts, isPopcatApiConfigured } from '../lib/popcatApi';

const LOCAL_STORAGE_KEY = 'gsd-popcat-counts-v2';
const MY_CLICKS_KEY = 'gsd-popcat-my-clicks'; // ← 추가
const MY_UUID_KEY = 'gsd-popcat-uuid'; // ← 추가
const CAMPUSES = ['문경', '음성', '세종'];
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

function getOrCreateUUID() {
    if (typeof window === 'undefined') return null;
    let uuid = window.localStorage.getItem(MY_UUID_KEY);
    if (!uuid) {
        uuid = crypto.randomUUID();
        window.localStorage.setItem(MY_UUID_KEY, uuid);
    }
    return uuid;
}

function readMyClicks() {
    if (typeof window === 'undefined') return { ...ZERO };
    try {
        const parsed = JSON.parse(window.localStorage.getItem(MY_CLICKS_KEY) || '{}');
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
    const [myCounts, setMyCounts] = useState(() => readMyClicks()); // ← 추가
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

    /* UUID 초기화 — 최초 방문 시 생성, 이후 유지 */
    useEffect(() => {
        getOrCreateUUID();
    }, []);

    /* 내 클릭 수 localStorage 저장 */
    useEffect(() => {
        window.localStorage.setItem(MY_CLICKS_KEY, JSON.stringify(myCounts));
    }, [myCounts]);

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
                        // 1. API 응답 상태 코드를 직접 확인하기 위해 fetch를 사용합니다.
                        const url =
                            (
                                import.meta.env.VITE_POPCAT_API_URL || 'https://gsd-gvcs-popcat.gcinhak.workers.dev'
                            ).replace(/\/$/, '') + '/api/popcat/increment';

                        const response = await fetch(url, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ campus: c, delta }),
                        });

                        // 2. 🛑 429 매크로 차단 응답이 왔을 때 알림창 띄우기
                        if (response.status === 429) {
                            alert(
                                '🚨 [경고] 비정상적인 요청 속도가 감지되었습니다.\n\n매크로 방지를 위해 5분간 팝캣 참여가 차단됩니다.'
                            );
                            window.location.reload(); // 새로고침하여 매크로 작동 강제 중단
                            return; // 함수 즉시 종료
                        }

                        // 3. 그 외 서버 에러 시 catch 문으로 보내기
                        if (!response.ok) {
                            throw new Error('서버 또는 네트워크 에러');
                        }
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

    /* 20초 주기 정해진 시간에 맞춘 동기화 폴링 (매 00초, 20초, 40초) */
    useEffect(() => {
        if (!isPopcatApiConfigured) return;
        let cancelled = false;
        let timeoutId = null;

        const pull = async () => {
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
            } finally {
                // 3. 요청이 끝나면 다음 정해진 타임스탬프를 계산해 다시 예약합니다.
                if (!cancelled) scheduleNextPull();
            }
        };

        const scheduleNextPull = () => {
            // 🛑 사용자가 팝캣 페이지를 안 보고 있다면 다음 타이머를 예약하지 않고 쉽니다.
            if (document.visibilityState !== 'visible') return;

            const now = Date.now();
            const INTERVAL = 20000; // 20초 (밀리초 단위)

            // 다음 정해진 시간(매 00초, 20초, 40초...)까지 남은 시간 계산
            const nextTick = Math.ceil(now / INTERVAL) * INTERVAL;
            const delay = nextTick - now;

            timeoutId = setTimeout(pull, delay);
        };

        // 1. 최초 접속 시 즉시 1회 갱신
        pull();

        // 2. 다음 정해진 시간 예약 시작
        scheduleNextPull();

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                pull(); // 돌아온 순간 즉시 서버 데이터 한 번 갱신하고 타이머 다시 시작
            } else {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            cancelled = true;
            if (timeoutId) clearTimeout(timeoutId);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, []);

    const press = (campus) => {
        if (IS_DISABLED) return;
        setOpenCampus(campus);
        setCounts((c) => ({ ...c, [campus]: (c[campus] || 0) + 1 }));
        setMyCounts((c) => ({ ...c, [campus]: (c[campus] || 0) + 1 })); // ← 추가

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
                                onPointerDown={(e) => {
                                    e.preventDefault();
                                    press(campus);
                                }}
                                aria-label={`${campus} 캠퍼스 응원하기`}
                            >
                                <span className="pop-btn-name">{campus}</span>
                                <span className="pop-btn-face" aria-hidden>
                                    {isOpen ? '😮' : '😺'}
                                </span>
                                <span className="pop-btn-count">{(myCounts[campus] || 0).toLocaleString()}</span>
                                <span className="pop-btn-hint">
                                    {IS_DISABLED ? '잠시 점검중' : isOpen ? 'POP!' : '내 응원 횟수'}
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

function ServerIndicator({ state }) {
    const map = {
        online: { dot: '#10b981', text: '서버 연결됨' },
        connecting: { dot: '#f59e0b', text: '연결중' },
        error: { dot: '#dc2626', text: '서버 연결 실패' },
        offline: { dot: '#9ca3af', text: '로컬 모드' },
    };
    const cur = map[state] || map.offline;

    return (
        <span className="server-indicator">
            <span className="si-dot" style={{ background: cur.dot }} />
            <span className="si-text">{cur.text}</span>
        </span>
    );
}

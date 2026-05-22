import { useEffect, useRef, useState } from 'react';
import PageHeader from '../components/PageHeader';
import CampusBadge from '../components/CampusBadge';
import AnimatedNumber from '../components/AnimatedNumber';
import { CAMPUS_COLORS } from '../data';
import { fetchCounts, isPopcatApiConfigured } from '../lib/popcatApi';

const LOCAL_STORAGE_KEY = 'gsd-popcat-counts-v2';
const MY_CLICKS_KEY = 'gsd-popcat-my-clicks'; // ← 추가
const MY_UUID_KEY = 'gsd-popcat-uuid'; // ← 추가
const BAN_KEY = 'gsd-popcat-ban-until';
// SPA 이탈(컴포넌트 언마운트) 시 미전송 데이터를 보존하는 키
// → 탭/브라우저 닫기가 아닌 페이지 이동에서는 POST를 보내지 않고 여기에 저장
const SPA_PENDING_KEY = 'gsd-popcat-spa-pending-v1';
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
    try {
        let uuid = window.localStorage.getItem(MY_UUID_KEY);
        if (!uuid) {
            uuid = crypto.randomUUID();
            window.localStorage.setItem(MY_UUID_KEY, uuid);
        }
        return uuid;
    } catch {
        // 시크릿 모드 또는 localStorage 차단 환경
        return null;
    }
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
    const [banUntil, setBanUntil] = useState(() => {
        try {
            return Number(window.localStorage.getItem(BAN_KEY)) || 0;
        } catch {
            return 0;
        }
    });
    const [hasUuid] = useState(() => getOrCreateUUID() !== null);
    const [isBanned, setIsBanned] = useState(() => {
        try {
            const storedBan = Number(window.localStorage.getItem(BAN_KEY)) || 0;
            return Date.now() < storedBan;
        } catch {
            return false;
        }
    });
    const uiDisabled = IS_DISABLED || isBanned || !hasUuid; // 💡 !hasUuid 추가
    const popIdRef = useRef(0);
    const releaseTimers = useRef({});
    const pendingRef = useRef({ ...ZERO });
    const flushTimerRef = useRef(null);
    const schedulerRef = useRef(() => {});

    useEffect(() => {
        // 밴 상태가 아니면 타이머를 돌릴 필요 없음
        if (!isBanned || banUntil === 0) return;

        const timeLeft = banUntil - Date.now();

        // 비동기(setTimeout) 내부의 상태 변경은 에러를 발생시키지 않음
        const timer = setTimeout(
            () => {
                setIsBanned(false);
                setBanUntil(0);
                window.localStorage.removeItem(BAN_KEY);
            },
            Math.max(timeLeft, 0)
        ); // 시간이 꼬여서 음수가 나오더라도 즉시 실행되도록 방어

        return () => clearTimeout(timer);
    }, [isBanned, banUntil]);

    /* localStorage 캐시 (로컬모드 한정) */
    useEffect(() => {
        if (isPopcatApiConfigured) return;
        try {
            window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(counts));
        } catch {
            /* 무시 */
        }
    }, [counts]);

    /* UUID 초기화 — 최초 방문 시 생성, 이후 유지 */
    useEffect(() => {
        getOrCreateUUID();
    }, []);

    /* 내 클릭 수 localStorage 저장 */
    useEffect(() => {
        try {
            window.localStorage.setItem(MY_CLICKS_KEY, JSON.stringify(myCounts));
        } catch {
            /* 무시 */
        }
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

            // 💡 1. 캠퍼스별 반복문(for)을 삭제하고, 보낼 데이터를 하나의 배열(Batch)로 모읍니다.
            const updates = CAMPUSES.map((c) => ({ campus: c, delta: toSend[c] })).filter((item) => item.delta > 0);

            // 💡 2. 보낼 데이터가 없다면 여기서 종료
            if (updates.length === 0) return;

            try {
                const url =
                    (import.meta.env.VITE_POPCAT_API_URL || 'https://gsd-gvcs-popcat.gcinhak.workers.dev').replace(
                        /\/$/,
                        ''
                    ) + '/api/popcat/increment';

                // 💡 3. 루프 없이 단 한 번의 API 호출만 실행!
                // 기존 { campus, delta, uuid } 대신 { updates, uuid } 를 보냅니다.
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ updates, uuid: getOrCreateUUID() }),
                });

                // 4. 🛑 429 매크로 차단 응답이 왔을 때 알림창 띄우기 (기존 로직 유지)
                if (response.status === 429) {
                    // pending 완전 초기화 — 재전송 시도 차단
                    pendingRef.current = { ...ZERO };
                    setPendingTotal(0);
                    if (flushTimerRef.current) {
                        clearTimeout(flushTimerRef.current);
                        flushTimerRef.current = null;
                    }

                    try {
                        const unbanTime = Date.now() + 5 * 60 * 1000;
                        window.localStorage.setItem(BAN_KEY, unbanTime);
                        setBanUntil(unbanTime);
                    } catch {
                        /* 무시 */
                    }
                    setIsBanned(true);

                    alert(
                        '🚨 [경고] 비정상적인 요청 속도가 감지되었습니다.\n\n매크로 방지를 위해 5분간 팝캣 참여가 차단됩니다.'
                    );
                    return;
                }

                // 5. 그 외 서버 에러 시 catch 문으로 보내기
                if (!response.ok) {
                    throw new Error('서버 또는 네트워크 에러');
                }
            } catch {
                // 💡 에러 발생 시, 실패한 모든 캠퍼스 수치를 다시 누적
                updates.forEach(({ campus, delta }) => {
                    pendingRef.current[campus] += delta;
                });
            }

            const remaining = CAMPUSES.reduce((s, c) => s + pendingRef.current[c], 0);
            setPendingTotal(remaining);
            if (remaining > 0) {
                flushTimerRef.current = setTimeout(flush, FLUSH_MS);
            }
        };

        schedulerRef.current = () => {
            if (flushTimerRef.current) return;
            if (isBanned) return; // 💡 밴 상태면 예약 자체를 하지 않음

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
    }, [isBanned]);

    /* 페이지 이탈 시 마지막 저장 시도 (keepalive fetch) */
    useEffect(() => {
        if (!isPopcatApiConfigured) return;

        // ─────────────────────────────────────────────────────────────
        // SPA 복귀 시: 이전 페이지 이동에서 저장해 둔 미전송 데이터 복원
        // ─────────────────────────────────────────────────────────────
        try {
            const stored = JSON.parse(window.localStorage.getItem(SPA_PENDING_KEY) || '{}');
            let restoredTotal = 0;
            for (const c of CAMPUSES) {
                const v = Number(stored[c]) || 0;
                if (v > 0) {
                    pendingRef.current[c] = (pendingRef.current[c] || 0) + v;
                    restoredTotal += v;
                }
            }
            if (restoredTotal > 0) {
                window.localStorage.removeItem(SPA_PENDING_KEY);
                setTimeout(() => setPendingTotal((p) => p + restoredTotal), 0);
                schedulerRef.current();
            }
        } catch {
            /* ignore */
        }

        // ─────────────────────────────────────────────────────────────
        // 💡 [변경 완료] 실제 탭/브라우저 닫기 시 1번의 묶음(Batch) POST만 전송
        // ─────────────────────────────────────────────────────────────
        const flushToServer = () => {
            const pending = pendingRef.current;

            // 보낼 데이터 배열 구성
            const updates = CAMPUSES.map((c) => ({ campus: c, delta: pending[c] })).filter((item) => item.delta > 0);

            if (updates.length > 0) {
                const url =
                    (import.meta.env.VITE_POPCAT_API_URL || 'https://gsd-gvcs-popcat.gcinhak.workers.dev').replace(
                        /\/$/,
                        ''
                    ) + '/api/popcat/increment';
                try {
                    // 한 번의 POST 요청만 전송
                    fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ updates, uuid: getOrCreateUUID() }),
                        keepalive: true,
                    });
                } catch {
                    /* ignore */
                }
            }
            pendingRef.current = { ...ZERO };
        };

        window.addEventListener('beforeunload', flushToServer);
        window.addEventListener('pagehide', flushToServer);

        return () => {
            window.removeEventListener('beforeunload', flushToServer);
            window.removeEventListener('pagehide', flushToServer);

            // ─────────────────────────────────────────────────────────
            // SPA 이탈(컴포넌트 언마운트): POST 금지 — localStorage에 보존
            // ─────────────────────────────────────────────────────────
            const pending = pendingRef.current;
            const hasData = CAMPUSES.some((c) => pending[c] > 0);
            if (hasData) {
                try {
                    const existing = JSON.parse(window.localStorage.getItem(SPA_PENDING_KEY) || '{}');
                    const merged = {};
                    for (const c of CAMPUSES) {
                        merged[c] = (Number(existing[c]) || 0) + (pending[c] || 0);
                    }
                    window.localStorage.setItem(SPA_PENDING_KEY, JSON.stringify(merged));
                } catch {
                    /* ignore */
                }
            }
            pendingRef.current = { ...ZERO };
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
            const jitter = Math.random() * 2500; // 0~2.5초 랜덤 지연
            const delay = nextTick - now + jitter;

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
        if (uiDisabled) {
            if (isBanned) alert('🚨 매크로 차단 중입니다. 남은 시간을 기다려주세요.');
            return;
        }
        setOpenCampus(campus);

        // setCounts((c) => ({ ...c, [campus]: (c[campus] || 0) + 1 }));
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
                            <span className="pb-total">
                                총 <AnimatedNumber value={total} /> POPS
                            </span>
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
                                        <span className="pb-count-num">
                                            <AnimatedNumber value={count} />
                                        </span>
                                        <span className="pb-count-pct">{pct.toFixed(1)}%</span>
                                    </div>
                                    {/* {isLeader && (
                                        <span className="pb-crown" aria-hidden>
                                            👑
                                        </span>
                                    )} */}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {!hasUuid && (
                    <div className="popcat-uuid-warning">
                        <span className="uuid-warning-icon">🔒</span>
                        <div className="uuid-warning-text">
                            <strong>시크릿 모드 또는 개인정보 보호 브라우저에서는 참여할 수 없습니다.</strong>
                            <p>일반 모드로 접속하면 팝캣에 참여할 수 있어요.</p>
                        </div>
                    </div>
                )}

                <section className="pop-battle">
                    {CAMPUSES.map((campus) => {
                        const color = CAMPUS_COLORS[campus];
                        const isOpen = openCampus === campus;
                        const campusPops = pops.filter((p) => p.campus === campus);
                        return (
                            <button
                                key={campus}
                                className={`pop-btn ${isOpen ? 'open' : ''} ${uiDisabled ? 'disabled' : ''}`}
                                disabled={uiDisabled}
                                style={{
                                    '--btn-bg': color?.bg,
                                    '--btn-soft': color?.soft,
                                    opacity: uiDisabled ? 0.45 : 1,
                                    cursor: uiDisabled ? 'not-allowed' : 'pointer',
                                    filter: uiDisabled ? 'grayscale(60%)' : 'none',
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

import { useEffect, useRef, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { HIGHLIGHTS } from '../data';

const STORAGE_KEY = 'gsd-popcat-total';

export default function PopcatPage() {
    const [count, setCount] = useState(() => {
        if (typeof window === 'undefined') return 0;
        const v = window.localStorage.getItem(STORAGE_KEY);
        return v ? Number(v) || 0 : 0;
    });
    const [isOpen, setIsOpen] = useState(false);
    const [pops, setPops] = useState([]);
    const popIdRef = useRef(0);
    const releaseRef = useRef(null);

    useEffect(() => {
        window.localStorage.setItem(STORAGE_KEY, String(count));
    }, [count]);

    const press = () => {
        setIsOpen(true);
        setCount((c) => c + 1);
        const id = popIdRef.current++;
        setPops((prev) => [...prev, { id, x: 40 + Math.random() * 20, y: 0 }]);
        setTimeout(() => {
            setPops((prev) => prev.filter((p) => p.id !== id));
        }, 900);
        clearTimeout(releaseRef.current);
        releaseRef.current = setTimeout(() => setIsOpen(false), 140);
    };

    const reset = () => {
        if (!window.confirm('내 클릭 카운트를 초기화할까요?')) return;
        setCount(0);
    };

    return (
        <div className="page popcat-page">
            <div className="popcat-inner">
                <PageHeader
                    eyebrow="POPCAT · BETA"
                    title="팝캣 응원 카운터"
                    description="누르면 숫자가 올라가는 응원 카운터. 응원이 쌓일수록 점수가 올라가요."
                />

                <div className="popcat-stage">
                    <div className="popcat-count">
                        <span className="pc-num">{count.toLocaleString()}</span>
                        <span className="pc-label">POPS</span>
                    </div>

                    <button
                        className={`popcat-btn ${isOpen ? 'open' : ''}`}
                        onMouseDown={press}
                        onTouchStart={(e) => { e.preventDefault(); press(); }}
                        aria-label="팝캣 누르기"
                    >
                        <span className="popcat-face" aria-hidden>
                            {isOpen ? '😮' : '😺'}
                        </span>
                        <span className="popcat-hint">{isOpen ? 'POP!' : 'CLICK'}</span>
                        {pops.map((p) => (
                            <span key={p.id} className="popcat-pop" style={{ left: `${p.x}%` }}>
                                +1
                            </span>
                        ))}
                    </button>

                    <button className="popcat-reset" onClick={reset}>
                        🔄 내 카운트 초기화
                    </button>
                </div>

                <section className="highlight-section">
                    <header className="hl-head">
                        <h3>🎬 하이라이트만 모아보기</h3>
                        <span className="hl-badge">COMING SOON</span>
                    </header>
                    {HIGHLIGHTS.length === 0 ? (
                        <div className="hl-empty">
                            <p>본선이 끝나면 명장면만 모은 하이라이트 영상이 이곳에 모입니다.</p>
                            <ul>
                                <li>· 종목별 베스트 플레이</li>
                                <li>· 응원전 명장면</li>
                                <li>· 시상식 / 세리머니</li>
                            </ul>
                        </div>
                    ) : (
                        <div className="hl-grid">
                            {HIGHLIGHTS.map((h) => (
                                <a
                                    key={h.id}
                                    className="hl-card"
                                    href={`https://www.youtube.com/watch?v=${h.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <img src={`https://img.youtube.com/vi/${h.id}/hqdefault.jpg`} alt={h.label} />
                                    <div className="hl-meta">
                                        <span className="hl-year">{h.year}</span>
                                        <span className="hl-label">{h.label}</span>
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

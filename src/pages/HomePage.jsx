import { useEffect, useState } from 'react';
import useCountdown from '../hooks/useCountdown';
import syncHeroImg from '../assets/sync_hero.png';

const NOTICE_KEY = 'gsd-notice-popcat-pause-v2';

function Digit({ value, label }) {
    const str = String(value).padStart(2, '0');
    return (
        <div className="digit-box">
            <div className="digit-num">{str}</div>
            <div className="digit-label">{label}</div>
        </div>
    );
}

function PopcatNotice({ onClose }) {
    const [dontShow, setDontShow] = useState(false);
    const close = () => onClose(dontShow);

    return (
        <div className="notice-backdrop" onClick={close}>
            <div className="notice-modal" onClick={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    className="notice-close"
                    onClick={close}
                    aria-label="닫기"
                >
                    ✕
                </button>
                <div className="notice-icon">🐱</div>
                <h2 className="notice-title">팝캣 기능 일시 중단 안내</h2>
                <p className="notice-body">
                    현재 팝캣에서 비정상 프로그램(매크로 등) 사용 사례가
                    다수 확인되어 서비스를 잠시 중단합니다.
                </p>
                <p className="notice-body">
                    <strong>5월 26일</strong>, 새로운 모습으로 다시 만나요! 🎉
                </p>
                <label className="notice-dont-show">
                    <input
                        type="checkbox"
                        checked={dontShow}
                        onChange={(e) => setDontShow(e.target.checked)}
                    />
                    <span>다시 보지 않기</span>
                </label>
                <button type="button" className="notice-ok" onClick={close}>
                    확인
                </button>
            </div>
        </div>
    );
}

export default function HomePage() {
    const { days, hours, minutes, seconds } = useCountdown();
    const [ready, setReady] = useState(false);
    const [showNotice, setShowNotice] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setReady(true), 60);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        // 홈 진입/새로고침마다 다시 표시. "다시 보지 않기" 체크한 경우만 숨김.
        if (window.localStorage.getItem(NOTICE_KEY) !== '1') {
            setShowNotice(true);
        }
    }, []);

    const dismiss = (dontShowAgain) => {
        setShowNotice(false);
        if (dontShowAgain && typeof window !== 'undefined') {
            window.localStorage.setItem(NOTICE_KEY, '1');
        }
    };

    return (
        <>
            <div className={`page hero-page ${ready ? 'ready' : ''}`}>
                <section className="hero-bg">
                    <div className="hero-inner-top">
                        <span className="hero-badge anim-1">GLOBAL SPORTS FESTIVAL</span>
                        <h1 className="hero-title anim-2">
                            <span className="ht-year">2026</span>
                            <span className="ht-main">글로벌 체육 축제</span>
                        </h1>
                        <p className="hero-date anim-3">2026년 5월 30일 (토) 09:00</p>
                    </div>
                </section>

                <div className="countdown anim-4">
                    <Digit value={days} label="DAYS" />
                    <span className="cd-sep">:</span>
                    <Digit value={hours} label="HOURS" />
                    <span className="cd-sep">:</span>
                    <Digit value={minutes} label="MIN" />
                    <span className="cd-sep">:</span>
                    <Digit value={seconds} label="SEC" />
                </div>

                <div className="hero-sync anim-5">
                    <img src={syncHeroImg} alt="Sync" />
                </div>
            </div>
            {showNotice && <PopcatNotice onClose={dismiss} />}
        </>
    );
}

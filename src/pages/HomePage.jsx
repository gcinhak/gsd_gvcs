import { useEffect, useState } from 'react';
import useCountdown from '../hooks/useCountdown';
import syncHeroImg from '../assets/sync_hero.png';

function Digit({ value, label }) {
    const str = String(value).padStart(2, '0');
    return (
        <div className="digit-box">
            <div className="digit-num">{str}</div>
            <div className="digit-label">{label}</div>
        </div>
    );
}

export default function HomePage() {
    const { days, hours, minutes, seconds } = useCountdown();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setReady(true), 60);
        return () => clearTimeout(t);
    }, []);

    return (
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
    );
}

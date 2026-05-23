import { useEffect, useRef, useState } from 'react';

const READY = 'ready';   // 빨강 — 기다리세요
const GO = 'go';         // 초록 — 클릭!
const TOO_EARLY = 'early';
const TOO_SLOW = 'slow';
const SUCCESS = 'success';
const TIMEOUT = 'timeout';
const THRESHOLD_MS = 400;

export default function ReactionGame({ onWin, onLose }) {
    const [phase, setPhase] = useState(READY);
    const [reactionMs, setReactionMs] = useState(null);
    const goTimerRef = useRef(null);
    const timeoutTimerRef = useRef(null);
    const goStartRef = useRef(0);

    useEffect(() => {
        // 1.5 ~ 4.5초 사이에 GO 로 전환
        const delay = 1500 + Math.random() * 3000;
        goTimerRef.current = setTimeout(() => {
            setPhase(GO);
            goStartRef.current = Date.now();
            // GO 후 1.5초 안에 못 누르면 timeout
            timeoutTimerRef.current = setTimeout(() => {
                setPhase(TIMEOUT);
                setTimeout(() => onLose?.(), 800);
            }, 1500);
        }, delay);
        return () => {
            clearTimeout(goTimerRef.current);
            clearTimeout(timeoutTimerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const click = () => {
        if (phase === READY) {
            clearTimeout(goTimerRef.current);
            setPhase(TOO_EARLY);
            setTimeout(() => onLose?.(), 800);
        } else if (phase === GO) {
            clearTimeout(timeoutTimerRef.current);
            const ms = Date.now() - goStartRef.current;
            setReactionMs(ms);
            if (ms <= THRESHOLD_MS) {
                setPhase(SUCCESS);
                setTimeout(() => onWin?.(), 800);
            } else {
                setPhase(TOO_SLOW);
                setTimeout(() => onLose?.(), 800);
            }
        }
    };

    const label = {
        [READY]: '잠시만 기다리세요…',
        [GO]: '지금 클릭!',
        [TOO_EARLY]: '너무 빨라요!',
        [TOO_SLOW]: `너무 느려요! ${reactionMs}ms`,
        [SUCCESS]: `성공! ${reactionMs}ms`,
        [TIMEOUT]: '시간 초과!',
    }[phase];

    return (
        <div className="game-reaction">
            <div className="game-tag">⚡ 반응속도</div>
            <button
                type="button"
                className={`gr-pad phase-${phase}`}
                onClick={click}
                disabled={phase === SUCCESS || phase === TOO_EARLY || phase === TOO_SLOW || phase === TIMEOUT}
            >
                <span className="gr-text">{label}</span>
            </button>
            <div className="gr-hint">초록색으로 바뀌면 {THRESHOLD_MS}ms 이내로 누르세요!</div>
        </div>
    );
}

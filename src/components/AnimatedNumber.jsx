import { useEffect, useRef, useState } from 'react';

export default function AnimatedNumber({ value, duration = 500 }) {
    const [displayValue, setDisplayValue] = useState(value);

    // 💡 1. displayValue의 최신 값을 항상 추적하는 Ref를 생성합니다.
    const displayValueRef = useRef(displayValue);
    useEffect(() => {
        displayValueRef.current = displayValue;
    }, [displayValue]);

    useEffect(() => {
        let frameId;

        // 💡 2. 상태(State) 대신 Ref에서 값을 읽어옵니다.
        // 이렇게 하면 useEffect가 displayValue에 의존하지 않게 되므로 경고가 사라집니다!
        const startValue = displayValueRef.current;
        const targetValue = value;
        const startTime = performance.now();

        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // 숫자를 부드럽게 증가시키는 로직 (선형 보간)
            const current = Math.round(startValue + (targetValue - startValue) * progress);
            setDisplayValue(current);

            if (progress < 1) {
                frameId = requestAnimationFrame(animate);
            }
        };

        frameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameId);
    }, [value, duration]); // 💡 의존성 배열이 깔끔하게 유지되어 경고가 완벽히 해결됩니다!

    return <>{displayValue.toLocaleString()}</>;
}

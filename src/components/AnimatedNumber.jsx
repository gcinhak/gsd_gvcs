// src/components/AnimatedNumber.jsx
import { useState, useEffect } from 'react';

export default function AnimatedNumber({ value }) {
    const [displayValue, setDisplayValue] = useState(value);

    useEffect(() => {
        let start = displayValue;
        const end = value;
        if (start === end) return;

        const duration = 1200; // ⏱️ 1.2초 동안 부드럽게 상승
        const startTime = performance.now();
        let frameId;

        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease-out 효과: 처음엔 빠르게, 끝날 땐 자연스럽게 감속
            const easeOutQuad = progress * (2 - progress);
            const current = Math.floor(start + (end - start) * easeOutQuad);

            setDisplayValue(current);

            if (progress < 1) {
                frameId = requestAnimationFrame(animate);
            }
        };

        frameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameId);
    }, [value]);

    return <>{displayValue.toLocaleString()}</>;
}

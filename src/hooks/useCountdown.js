import { useEffect, useState } from 'react';
import { TARGET_DATE } from '../data';

export default function useCountdown(target = TARGET_DATE) {
    const calc = () => {
        const diff = target - new Date();
        if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
        return {
            days: Math.floor(diff / 86400000),
            hours: Math.floor((diff % 86400000) / 3600000),
            minutes: Math.floor((diff % 3600000) / 60000),
            seconds: Math.floor((diff % 60000) / 1000),
            done: false,
        };
    };
    const [time, setTime] = useState(calc);
    useEffect(() => {
        const id = setInterval(() => setTime(calc()), 1000);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target]);
    return time;
}

import { useState, useEffect } from 'react';

// dashboard.jsx에 있던 포맷 함수들을 이쪽으로 옮겨옵니다.
function formatDashboardDate(date) {
    const pad = (value) => String(value).padStart(2, '0');
    const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} (${weekday})`;
}

function formatDashboardTime(date) {
    const pad = (value) => String(value).padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export default function LiveClock() {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const timer = window.setInterval(() => setNow(new Date()), 1000);
        return () => window.clearInterval(timer);
    }, []);

    return (
        <time className="db-live-clock" dateTime={now.toISOString()}>
            <span className="db-live-time">{formatDashboardTime(now)}</span>
            <span className="db-live-date">{formatDashboardDate(now)}</span>
        </time>
    );
}

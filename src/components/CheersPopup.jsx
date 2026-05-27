import { useState, useEffect } from 'react';
import { YEARS, CAMPUS_COLORS } from '../data/data';

const POPUP_KEY = 'cheers_popup_2026';

export default function CheersPopup() {
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState(0);

    const yearData = YEARS.find((y) => y.year === 2026);
    const videos = yearData?.videos ?? [];

    useEffect(() => {
        const last = localStorage.getItem(POPUP_KEY);
        const today = new Date().toDateString();
        if (last !== today) {
            // 홈 진입 후 0.8초 뒤에 팝업
            const t = setTimeout(() => setOpen(true), 800);
            return () => clearTimeout(t);
        }
    }, []);

    const close = () => {
        setOpen(false); // 그냥 닫기만 (다음 진입 시 다시 뜸)
    };

    const closeDontShow = () => {
        localStorage.setItem(POPUP_KEY, new Date().toDateString()); // 하루 억제
        setOpen(false);
    };

    if (!open || !yearData) return null;

    const getCampusColor = (campusName) => {
        if (campusName?.includes('음성')) return CAMPUS_COLORS['음성']?.bg ?? '#dc2626';
        if (campusName?.includes('문경')) return CAMPUS_COLORS['문경']?.bg ?? '#1d4ed8';
        return yearData.color;
    };

    const activeVideo = videos[tab];
    const accentColor = getCampusColor(activeVideo?.campus);

    return (
        // backdrop
        <div
            className="popup-backdrop"
            onClick={close}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                background: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
            }}
        >
            {/* modal */}
            <div
                className="popup-modal"
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'var(--surface)',
                    borderRadius: '1rem',
                    width: '100%',
                    maxWidth: '680px',
                    overflow: 'hidden',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                    border: `1px solid ${accentColor}44`,
                    transition: 'border-color 0.3s',
                }}
            >
                {/* 헤더 */}
                <div
                    style={{
                        padding: '1rem 1.25rem',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--muted)', letterSpacing: '0.1em' }}>
                            NEW · 2026 GLOBAL SPORTS FESTIVAL
                        </div>
                    </div>
                    <button
                        onClick={close}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--muted)',
                            fontSize: '1.2rem',
                            padding: '0.25rem',
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* 캠퍼스 탭 */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
                    {videos.map((v, i) => {
                        const color = getCampusColor(v.campus);
                        const isActive = tab === i;
                        return (
                            <button
                                key={v.id}
                                onClick={() => setTab(i)}
                                style={{
                                    flex: 1,
                                    padding: '0.65rem',
                                    background: isActive ? color : 'transparent',
                                    color: isActive ? '#fff' : 'var(--muted)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: isActive ? 700 : 400,
                                    fontSize: '0.9rem',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {v.campus} {v.label}
                            </button>
                        );
                    })}
                </div>

                {/* 영상 */}
                <div style={{ aspectRatio: '16/9', background: '#000' }}>
                    <iframe
                        key={activeVideo.id}
                        src={`https://www.youtube.com/embed/${activeVideo.id}?rel=0&modestbranding=1`}
                        title={activeVideo.label}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                    />
                </div>

                {/* 푸터 */}
                <div
                    style={{
                        padding: '0.75rem 1.25rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.8rem',
                        color: 'var(--muted)',
                    }}
                >
                    <span>탭을 눌러 다른 캠퍼스 영상을 볼 수 있어요</span>
                    <button
                        onClick={closeDontShow}
                        style={{
                            background: 'none',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            padding: '0.3rem 0.8rem',
                            cursor: 'pointer',
                            color: 'var(--muted)',
                            fontSize: '0.8rem',
                        }}
                    >
                        오늘 하루 보지 않기
                    </button>
                </div>
            </div>
        </div>
    );
}

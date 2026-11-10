import { useId, useState } from 'react';

/**
 * 시즌 공용 블록.
 *  - SeasonPending : 2027 자료가 없을 때 맨 위에 고정되는 「미정」 카드
 *  - SeasonTitle   : 2027 자료가 있을 때 그 위에 붙는 시즌 제목줄
 *  - ArchiveSection: 「2026 기록」 보관 영역 (접기/펼치기)
 *  - AccordionItem : 기록 안에서 쓰는 하위 접기/펼치기 항목
 */

export function SeasonPending({ year = 2027, title, message }) {
    return (
        <section className="season-pending" aria-label={`${year} 자료 미정`}>
            <div className="sp-text">
                <span className="sp-year">{year}</span>
                <h2 className="sp-title">{title}</h2>
                {message && <p className="sp-message">{message}</p>}
            </div>
            <span className="sp-badge">미정</span>
        </section>
    );
}

export function SeasonTitle({ year = 2027, title }) {
    return (
        <div className="season-title">
            <span className="season-title-year">{year}</span>
            <h2>{title}</h2>
        </div>
    );
}

export function ArchiveSection({ year = 2026, title, meta, defaultOpen = false, children }) {
    const [open, setOpen] = useState(defaultOpen);
    const bodyId = useId();
    return (
        <section className={`archive-section ${open ? 'is-open' : ''}`}>
            <button
                type="button"
                className="archive-head"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls={bodyId}
            >
                <span className="archive-badge">{year} 기록</span>
                <span className="archive-title">{title}</span>
                {meta && <span className="archive-meta">{meta}</span>}
                <span className="archive-chevron" aria-hidden>
                    ▾
                </span>
            </button>
            {open && (
                <div className="archive-body" id={bodyId}>
                    {children}
                </div>
            )}
        </section>
    );
}

export function AccordionItem({ title, meta, defaultOpen = false, children }) {
    const [open, setOpen] = useState(defaultOpen);
    const bodyId = useId();
    return (
        <div className={`acc-item ${open ? 'is-open' : ''}`}>
            <button
                type="button"
                className="acc-head"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls={bodyId}
            >
                <span className="acc-title">{title}</span>
                {meta && <span className="acc-meta">{meta}</span>}
                <span className="acc-chevron" aria-hidden>
                    ▾
                </span>
            </button>
            {open && (
                <div className="acc-body" id={bodyId}>
                    {children}
                </div>
            )}
        </div>
    );
}

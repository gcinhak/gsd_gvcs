import PageHeader from '../components/PageHeader';

const SCHEDULE_BLOCKS = [
    {
        num: '01',
        label: '예선',
        items: [
            { name: '사전 경기 · 농구', date: '2026년 5월 28일 (목)' },
            { name: '사전 경기 · 배구', date: '2026년 5월 29일 (금)' },
        ],
    },
    {
        num: '02',
        label: '본선',
        items: [
            { name: '체육축제', date: '2026년 5월 30일 (토)', highlight: true },
        ],
    },
];

export default function SchedulePage() {
    return (
        <div className="page schedule-page">
            <div className="schedule-inner">
                <PageHeader
                    eyebrow="GLOBAL SPORTS FESTIVAL"
                    title="경기 일정"
                    description="2026 글로벌 체육 축제의 예선전과 본선 일정입니다."
                />

                <div className="schedule-blocks">
                    {SCHEDULE_BLOCKS.map((block) => (
                        <section key={block.num} className="sched-block">
                            <header className="sb-section-head">
                                <span className="sb-num">{block.num}</span>
                                <h2 className="sb-section-title">{block.label}</h2>
                            </header>
                            <ul className="sb-items">
                                {block.items.map((it, i) => (
                                    <li key={i} className={`sb-item ${it.highlight ? 'is-highlight' : ''}`}>
                                        <span className="sb-item-name">{it.name}</span>
                                        <span className="sb-item-date">{it.date}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>
            </div>
        </div>
    );
}

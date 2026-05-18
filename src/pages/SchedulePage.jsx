import PageHeader from '../components/PageHeader';

export default function SchedulePage() {
    return (
        <div className="page schedule-page">
            <div className="schedule-inner">
                <PageHeader
                    eyebrow="GLOBAL SPORTS FESTIVAL"
                    title="경기 일정"
                />

                <div className="schedule-placeholder">
                    <div className="sp-icon" aria-hidden>📅</div>
                    <h2>경기 일정 준비중</h2>
                    <p>경기 일정이 공개되는 대로 이곳에서 바로 확인하실 수 있습니다.</p>
                    <div className="sp-dates">
                        <span className="sp-date-item">
                            <strong>예선</strong> 2026년 5월 28일(목) ~ 29일(금)
                        </span>
                        <span className="sp-date-item">
                            <strong>본선</strong> 2026년 5월 30일(토)
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

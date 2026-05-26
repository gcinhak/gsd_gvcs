import PageHeader from '../components/PageHeader';

const DEVELOPERS = [
    '이다인',
    '정다희',
    '송민호',
    '김윤지',
    '조인택',
    '이하은',
    '정강우',
    '한수정',
    '홍성흔',
];

const FEATURE_BADGES = ['경기 일정', '선수 명단', '응원전 영상', '실시간 현황', '축제 기록'];

const STORIES = [
    {
        number: '01',
        label: 'CLUB',
        title: 'Sync 소개',
        description:
            'Sync는 글로벌선진학교 문경캠퍼스의 코딩 동아리로, 기술을 통해 새로운 가치를 만들고 함께 성장하는 학생 개발 커뮤니티입니다. 웹·앱 개발, AI, 디자인, 실시간 서비스 제작 등 다양한 프로젝트를 직접 기획하고 구현하며, 창의적인 문제 해결 능력과 실전 개발 역량을 키워가고 있습니다. 또한 코딩을 통해 학교 공동체를 더 즐겁고 가깝게 연결하는 것을 목표로 합니다.',
    },
    {
        number: '02',
        label: 'PROJECT',
        title: '체육축제 웹사이트를 기획하게 된 계기',
        description:
            'Global Sports Festival 웹사이트는 글로벌선진학교 모든 캠퍼스가 함께 체육축제를 온전히 즐길 수 있도록 만든 디지털 축제 플랫폼입니다. 경기 일정, 선수 명단, 응원전 영상, 실시간 현황을 한곳에서 확인할 수 있으며, 학생들이 더 쉽게 참여하고 함께 응원하며 체육축제의 추억을 오래 기록할 수 있도록 제작되었습니다.',
    },
];

function SyncMark() {
    return (
        <div className="sync-mark" aria-hidden="true">
            <svg viewBox="0 0 64 64" role="img">
                <path
                    d="M48 18A21 21 0 0 0 14 25"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="7"
                    strokeLinecap="round"
                />
                <path
                    d="M47 9v16H31"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M16 46a21 21 0 0 0 34-7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="7"
                    strokeLinecap="round"
                />
                <path
                    d="M17 55V39h16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </div>
    );
}

export default function UpcomingPage() {
    return (
        <div className="page credits-page">
            <section className="credits-roll" aria-label="Sync 소개와 제작진">
                <div className="credits-hero">
                    <div className="sync-mark-area">
                        <SyncMark />
                    </div>

                    <div className="credits-hero-content">
                        <PageHeader
                            eyebrow="ABOUT SYNC"
                            title="GVCS 문경캠퍼스 코딩동아리 Sync"
                            description="gsd.gvcs.kr은 Global Sports Festival의 순간을 더 빠르고 생생하게 공유하기 위해 Sync가 제작한 디지털 축제 플랫폼입니다."
                        />

                        <div className="credits-badges" aria-label="웹사이트 주요 기능">
                            {FEATURE_BADGES.map((badge) => (
                                <span key={badge}>{badge}</span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="credits-story">
                    {STORIES.map((story) => (
                        <article className="credits-story-card" key={story.number}>
                            <span className="credits-story-number">{story.number}</span>

                            <div className="credits-story-body">
                                <p className="credits-story-label">{story.label}</p>
                                <h2>{story.title}</h2>
                                <p>{story.description}</p>
                            </div>
                        </article>
                    ))}
                </div>

                <section className="credits-section" aria-label="제작진 명단">
                    <div className="credits-section-head">
                        <span>CREDITS</span>
                        <h2>Project Team</h2>
                    </div>

                    <div className="credits-list">
                        <article className="credits-role-card credits-role-card-lead">
                            <span>Project Lead</span>
                            <strong>김인학 선생님</strong>
                        </article>

                        <article className="credits-role-card credits-role-card-dev">
                            <div className="credits-role-top">
                                <span>Developers</span>
                                <small>{DEVELOPERS.length} Members</small>
                            </div>

                            <ul className="credits-name-list">
                                {DEVELOPERS.map((name) => (
                                    <li key={name}>{name}</li>
                                ))}
                            </ul>
                        </article>
                    </div>
                </section>

                <p className="credits-footer">
                    Built by Sync · GVCS Mungyeong Campus · Global Sports Festival
                </p>
            </section>
        </div>
    );
}
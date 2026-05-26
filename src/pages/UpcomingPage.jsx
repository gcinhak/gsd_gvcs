import PageHeader from '../components/PageHeader';

const DEVELOPERS = ['이다인', '정다희', '송민호', '김윤지', '조인택', '이하은', '정강우', '한수정', '홍성흔'];

export default function UpcomingPage() {
    return (
        <div className="page credits-page">
            <section className="credits-roll" aria-labelledby="credits-title">
                <PageHeader
                    eyebrow="GLOBAL SPORTS FESTIVAL"
                    title="GVCS 문경캠퍼스 코딩동아리 Sync"
                    description="gsd.gvcs.kr은 Global Sports Festival의 순간을 더 빠르고 생생하게 공유하기 위해 Sync가 제작한 디지털 축제 플랫폼입니다."
                />

                <div className="credits-story">
                    <section>
                        <span>01</span>
                        <div>
                            <h2>Sync 소개</h2>
                            <p>
                                Sync는 글로벌선진학교 문경캠퍼스의 코딩 동아리로, 기술을 통해 새로운 가치를 만들고 함께
                                성장하는 학생 개발 커뮤니티입니다. 웹·앱 개발, AI, 디자인, 실시간 서비스 제작 등 다양한
                                프로젝트를 직접 기획하고 개발하며, 창의적인 문제 해결 능력과 실전 개발 역량을 키워가고
                                있습니다. 또한 공모전과 교내 프로젝트에 적극적으로 참여하며, 코딩을 통해 학교 공동체와
                                세상을 연결하는 것을 목표로 하고 있습니다.
                            </p>
                        </div>
                    </section>
                    <section>
                        <span>02</span>
                        <div>
                            <h2>체육축제 웹페이지를 기획하게 된 계기</h2>
                            <p>
                                Global Sports Festival 웹사이트는 글로벌선진학교 모든 캠퍼스가 함께 체육축제를 온전히
                                즐길 수 있도록 만든 디지털 축제 공간입니다. 경기 일정, 선수 명단, 응원전 영상, 실시간
                                현황을 한곳에서 확인할 수 있으며, 학생들이 더 쉽게 참여하고 함께 응원하며 체육축제의
                                추억을 오래 기록할 수 있도록 제작되었습니다.
                            </p>
                        </div>
                    </section>
                </div>

                <section className="credits-section" aria-label="제작진 명단">
                    <div className="credits-section-head">
                        <span>CREDITS</span>
                    </div>
                    <div className="credits-list">
                        <div className="credits-role-group">
                            <span>Faculty Advisor</span>
                            <strong>김인학 선생님</strong>
                        </div>
                        <div className="credits-role-group">
                            <span>Project Leads</span>
                            <div className="credits-name-list">
                                <strong>정다희 / 이다인</strong>
                            </div>
                        </div>
                        <div className="credits-role-group">
                            <span>Developers</span>
                            <div className="credits-name-list">
                                <strong>송민호 / 김윤지 / 조인택 / 이하은 / 정강우 / 한수정 / 홍성흔</strong>
                            </div>
                        </div>
                    </div>
                </section>
            </section>
        </div>
    );
}

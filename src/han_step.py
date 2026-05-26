<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>가족의 숲</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
    <script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-orange-50 font-sans text-gray-800">
    <div id="root"></div>

    <script type="text/babel">
        const { useState } = React;

        function FamilyApp() {
            // 화면 상태: login -> survey -> dashboard
            const [currentScreen, setCurrentScreen] = useState('login');
            const [footprints, setFootprints] = useState(0);

            const completeQuest = () => {
                setFootprints(prev => prev + 2);
                alert('퀘스트 완료! 발자국 2개가 적립되었습니다. 🐾');
            };

            return (
                <div className="flex justify-center min-h-screen">
                    <div className="w-full max-w-md bg-white shadow-xl min-h-screen relative overflow-hidden flex flex-col">
                        
                        {/* 공통 헤더 */}
                        <header className="bg-orange-400 text-white p-4 text-center rounded-b-2xl shadow-sm">
                            <p className="text-xs font-light tracking-wider mb-1">부모님과 가까워지기 위해서</p>
                            <h1 className="text-lg font-bold">한걸음 앞에서 당겨주고, 한걸음 뒤에서 밀어주기</h1>
                        </header>

                        {/* 1. 로그인 & 가족 만들기 화면 */}
                        {currentScreen === 'login' && (
                            <div className="p-8 flex flex-col flex-1 justify-center items-center">
                                <h2 className="text-2xl font-bold mb-6 text-orange-600">가족의 숲에 오신걸 환영해요!</h2>
                                <input type="text" placeholder="아이디" className="w-full p-3 mb-3 border border-gray-300 rounded-lg" />
                                <input type="password" placeholder="비밀번호" className="w-full p-3 mb-6 border border-gray-300 rounded-lg" />
                                <button 
                                    onClick={() => setCurrentScreen('survey')}
                                    className="w-full bg-orange-500 text-white p-3 rounded-lg font-bold mb-3 hover:bg-orange-600"
                                >
                                    로그인
                                </button>
                                <button className="w-full border border-orange-500 text-orange-500 p-3 rounded-lg font-bold hover:bg-orange-50">
                                    자녀와 부모 가족 만들기 (초대)
                                </button>
                            </div>
                        )}

                        {/* 2. 초기 진단 설문 화면 */}
                        {currentScreen === 'survey' && (
                            <div className="p-8 flex flex-col flex-1">
                                <h2 className="text-xl font-bold mb-4">가족 성향 진단 (필수)</h2>
                                <p className="text-sm text-gray-600 mb-6">문제점과 관심사를 파악하여 맞춤형 해결 방안을 제시해 드립니다.</p>
                                
                                <div className="space-y-4 mb-8">
                                    <div className="bg-gray-100 p-4 rounded-lg">
                                        <p className="font-semibold mb-2">Q. 가장 대화가 부족하다고 느끼는 때는?</p>
                                        <select className="w-full p-2 border rounded">
                                            <option>진로/학업 이야기할 때</option>
                                            <option>취미/여가 시간</option>
                                            <option>평소 일상</option>
                                        </select>
                                    </div>
                                    <div className="bg-gray-100 p-4 rounded-lg">
                                        <p className="font-semibold mb-2">Q. 알림 주기를 설정해주세요</p>
                                        <select className="w-full p-2 border rounded">
                                            <option>매일</option>
                                            <option>주 1회</option>
                                            <option>월 1회</option>
                                        </select>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => setCurrentScreen('dashboard')}
                                    className="mt-auto w-full bg-orange-500 text-white p-3 rounded-lg font-bold"
                                >
                                    진단 완료 및 산책 시작하기 👉
                                </button>
                            </div>
                        )}

                        {/* 3. 메인 대시보드 (산책로 & 기능들) */}
                        {currentScreen === 'dashboard' && (
                            <div className="flex-1 overflow-y-auto bg-gray-50 pb-20">
                                
                                {/* 산책로 컨셉 맵 & 포인트 */}
                                <div className="bg-white p-6 mb-2 border-b">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-lg">🌳 우리가족 산책로</h3>
                                        <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-bold">
                                            🐾 {footprints} 걸음
                                        </div>
                                    </div>
                                    
                                    {/* 시각적 산책로 (프로그래스 바) */}
                                    <div className="relative w-full h-12 bg-green-100 rounded-full flex items-center px-4 overflow-hidden">
                                        <div 
                                            className="absolute left-0 top-0 h-full bg-green-400 transition-all duration-500 opacity-50"
                                            style={{ width: `${Math.min((footprints / 20) * 100, 100)}%` }}
                                        ></div>
                                        <div className="z-10 flex justify-between w-full">
                                            <span className="text-xl">🏃‍♂️</span>
                                            <span className="text-xl opacity-30">🎁</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-center text-gray-500 mt-2">
                                        발자국 20개를 모으면 기프티콘으로 교환할 수 있어요!
                                    </p>
                                </div>

                                {/* 일일 퀘스트 */}
                                <div className="p-4">
                                    <h3 className="font-bold mb-3">오늘의 추천 퀘스트 (발자국 +2)</h3>
                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-orange-600 text-sm">맞춤형 해결 방안</p>
                                            <p className="text-gray-800 text-sm mt-1">저녁 8시, 거실에서 보드게임 한 판 하기</p>
                                        </div>
                                        <button 
                                            onClick={completeQuest}
                                            className="bg-orange-100 text-orange-600 p-2 rounded-lg font-bold text-sm whitespace-nowrap ml-2 hover:bg-orange-200"
                                        >
                                            수행 완료
                                        </button>
                                    </div>
                                </div>

                                {/* 주요 기능 그리드 */}
                                <div className="grid grid-cols-2 gap-4 p-4">
                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center cursor-pointer hover:bg-gray-50">
                                        <div className="text-3xl mb-2">💬</div>
                                        <h4 className="font-bold text-sm mb-1">AI 맞춤형 상담</h4>
                                        <p className="text-xs text-gray-500">어시스턴트와 고민 나누기</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center cursor-pointer hover:bg-gray-50">
                                        <div className="text-3xl mb-2">📅</div>
                                        <h4 className="font-bold text-sm mb-1">전문가 상담 예약</h4>
                                        <p className="text-xs text-gray-500">실제 상담원 일정 잡기</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center cursor-pointer hover:bg-gray-50">
                                        <div className="text-3xl mb-2">🌐</div>
                                        <h4 className="font-bold text-sm mb-1">마음 번역기</h4>
                                        <p className="text-xs text-gray-500">서로의 언어 이해하기</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center cursor-pointer hover:bg-gray-50">
                                        <div className="text-3xl mb-2">🎁</div>
                                        <h4 className="font-bold text-sm mb-1">기프티콘 교환</h4>
                                        <p className="text-xs text-gray-500">모은 발자국 사용하기</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<FamilyApp />);
    </script>
</body>
</html>
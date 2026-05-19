import React from 'react';

// 1. 컴포넌트 이름을 더 명확하게 바꿉니다. (선택사항, 기존 SyncLogo도 무방)
export default function GvcsMgFooter({ imgSize = 22, textSize = 'xs' }) {
    return (
        // flex를 사용하여 이미지와 텍스트를 한 줄로 나란히 정렬합니다.
        // gap-1.5는 이미지와 텍스트 사이의 간격입니다. (Tailwind 기준 약 6px)
        <div className="flex items-center gap-1.5 text-gray-500">
            
            {/* 2. public 폴더에 넣은 이미지 (파일명: sync-logo.png 기준) */}
            <img 
                src="/sync-logo.png copy.jpg"   
                alt="MG Coding Club Sync Logo"
                style={{ width: imgSize, height: 'auto' }}
                className="object-contain inline-block flex-shrink-0"
            />
            
            {/* 3. 요청하신 긴 문구를 Tailwind로 스타일링 */}
            <span className={`text-${textSize} font-medium tracking-tight whitespace-nowrap`}>
                made by <span className="font-bold">GVCS MG coding club Sync</span>
            </span>
        </div>
    );
}

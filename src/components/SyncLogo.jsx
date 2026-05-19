import React from 'react';

export default function SyncLogo({ size = 22 }) {
    return (
        <img 
            src="/sync-logo.png"   // public 폴더 안의 이미지 이름
            alt="Sync Logo"
            style={{ width: size, height: 'auto' }} // 가로 크기에 맞춰 세로 비율 자동 조절 (깨짐 방지)
            className="object-contain inline-block"
        />
    );
}

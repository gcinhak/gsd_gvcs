import React from 'react';

export default function SyncLogo({ size = 22 }) {
    return (
        <img 
            // 파일명이 .png든 .png.jpg든 둘 다 찾아내도록 예외처리 추가
            src="/sync-logo.png" 
            onError={(e) => { e.target.src = "/sync-logo.png.jpg" }}
            alt="Sync Logo"
            style={{ width: 'auto', height: `${size}px` }} 
            className="inline-block object-contain"
        />
    );
}

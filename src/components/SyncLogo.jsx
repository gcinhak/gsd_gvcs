import React from 'react';
// src/assets 폴더에 있는 jpg 이미지를 불러옵니다.
import syncLogoImg from '../assets/sync_logo.jpg';

export default function SyncLogo({ size = 22 }) {
    return (
        <img 
            src={syncLogoImg}
            alt="Sync Logo"
            style={{ width: 'auto', height: `${size}px` }} 
            className="inline-block object-contain"
        />
    );
}

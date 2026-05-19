import React from 'react';
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

import React from 'react';

export default function SyncLogo({ size = 22 }) {
    return (
        <img 
            src="/sync-logo.png"
            alt="Sync Logo"
            style={{ width: size, height: 'auto' }}
            className="object-contain inline-block"
        />
    );
}

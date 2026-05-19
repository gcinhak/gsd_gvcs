import React from 'react';

export default function SyncLogo({ size = 22 }) {
    return (
        <img 
            src="/sync-logo.png" 
            onError={(e) => { e.target.src = "/sync-logo.png.jpg" }}
            alt="Sync Logo"
            style={{ width: 'auto', height: `${size}px` }} 
            className="inline-block object-contain"
        />
    
cat << 'EOF' > src/components/SyncLogo.jsx
import React from 'react';

export default function SyncLogo({ size = 22 }) {
    return (
        <img 
            src="/image.png"
            alt="Sync Logo"
            style={{ width: 'auto', height: `${size}px` }} 
            className="inline-block object-contain"
        />
    );
}

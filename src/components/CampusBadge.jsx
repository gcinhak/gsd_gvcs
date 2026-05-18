import { CAMPUS_COLORS } from '../data';

export default function CampusBadge({ campus, size = 'md', soft = false, className = '' }) {
    if (!campus) {
        return <span className={`campus-badge campus-badge-empty size-${size} ${className}`}>—</span>;
    }
    const colors = CAMPUS_COLORS[campus] || { bg: '#374151', text: '#fff', soft: '#e5e7eb' };
    const style = soft
        ? { background: colors.soft, color: colors.bg, borderColor: colors.bg }
        : { background: colors.bg, color: colors.text, borderColor: colors.bg };
    return (
        <span className={`campus-badge size-${size} ${soft ? 'is-soft' : ''} ${className}`} style={style}>
            {campus}
        </span>
    );
}

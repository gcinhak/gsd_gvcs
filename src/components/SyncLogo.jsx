export default function SyncLogo({ size = 22 }) {
    return (
        <svg
            className="sync-logo"
            width={size}
            height={size}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
        >
            <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
            <path
                d="M22 11.5C20.6 9.6 18.5 8.5 16 8.5C11.6 8.5 8 12.1 8 16.5"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
            <path
                d="M10 20.5C11.4 22.4 13.5 23.5 16 23.5C20.4 23.5 24 19.9 24 15.5"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
            <path d="M22 8.5L22 12.5L18 12.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 23.5L10 19.5L14 19.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

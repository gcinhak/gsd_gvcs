import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import ThemeSwitcher from './ThemeSwitcher';
import SyncLogo from './SyncLogo';

// LIVE / 라인업 탭은 dev 빌드에서만 노출. 운영 빌드에서는 숨김.
// 페이지는 /live · /lineup URL 직접 접근으로는 계속 동작.
const SHOW_DEV_TABS = import.meta.env.DEV;

const NAV_ITEMS = [
    { to: '/', label: '홈', end: true },
    { to: '/dashboard', label: '현황판' },
    { to: '/live', label: 'LIVE', live: true },
    { to: '/schedule', label: '경기 일정' },
    { to: '/lineup', label: '라인업' },
    { to: '/cheers', label: '응원전' },
    ...(SHOW_DEV_TABS ? [{ to: '/games', label: '경기 영상' }] : []),
    { to: '/history', label: '역대 전적' },
    { to: '/cheer', label: '🏰 점령전' },
    { to: '/about', label: 'About' },
];

export default function Layout() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="layout">
            <header className="site-header">
                <div className="header-inner">
                    <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
                        <span className="brand-mark">GVCS</span>
                        <span className="brand-sub">Global Sports Festival</span>
                    </Link>

                    <nav className={`primary-nav ${menuOpen ? 'open' : ''}`}>
                        {NAV_ITEMS.map((item) =>
                            item.disabled ? (
                                <span
                                    key={item.to}
                                    className="nav-link is-disabled"
                                    aria-disabled="true"
                                    title="기능 일시 중단됨"
                                >
                                    {item.label}
                                </span>
                            ) : (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.end}
                                    className={({ isActive }) =>
                                        `nav-link ${isActive ? 'active' : ''} ${item.live ? 'is-live' : ''}`
                                    }
                                    onClick={() => setMenuOpen(false)}
                                >
                                    {item.live && <span className="live-dot" aria-hidden />}
                                    {item.label}
                                </NavLink>
                            )
                        )}
                    </nav>

                    <div className="header-tools">
                        <ThemeSwitcher />
                        <button
                            className="menu-toggle"
                            aria-label="메뉴 열기"
                            aria-expanded={menuOpen}
                            onClick={() => setMenuOpen((v) => !v)}
                        >
                            <span />
                            <span />
                            <span />
                        </button>
                    </div>
                </div>
            </header>

            <main className="site-main">
                <Outlet />
            </main>

            <footer className="site-footer">
                <div className="footer-inner">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <SyncLogo size={22} />
                        <span style={{ fontSize: '13px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                            made by <strong>GVCS MG coding club Sync</strong>
                        </span>
                    </div>
                    <div className="footer-meta">
                        <span>© {new Date().getFullYear()} GVCS Global Sports Festival</span>
                        <a href="https://gsd.gvcs.kr" target="_blank" rel="noreferrer">
                            gsd.gvcs.kr
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

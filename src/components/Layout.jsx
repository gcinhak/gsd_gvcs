import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import ThemeSwitcher from './ThemeSwitcher';
import SyncLogo from './SyncLogo';

const NAV_ITEMS = [
    { to: '/', label: '홈', end: true },
    { to: '/schedule', label: '경기 일정' },
    { to: '/cheers', label: '응원전' },
    { to: '/games', label: '경기 영상' },
    { to: '/history', label: '역대 전적' },
    { to: '/popcat', label: '팝캣' },
    { to: '/upcoming', label: '예정 기능' },
];

export default function Layout() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="layout">
            <header className="site-header">
                <div className="header-inner">
                    <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
                        <span className="brand-mark">GVCSMG</span>
                        <span className="brand-sub">Global Sports Festival</span>
                    </Link>

                    <nav className={`primary-nav ${menuOpen ? 'open' : ''}`}>
                        {NAV_ITEMS.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                onClick={() => setMenuOpen(false)}
                            >
                                {item.label}
                            </NavLink>
                        ))}
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
                    <div className="footer-watermark">
                        <SyncLogo size={20} />
                        <span>
                            made by <strong>문경캠 Sync 코딩동아리</strong>
                        </span>
                    </div>
                    <div className="footer-meta">
                        <span>© {new Date().getFullYear()} GVCSMG Global Sports Festival</span>
                        <a href="https://gsd.gvcs.kr" target="_blank" rel="noreferrer">
                            gsd.gvcs.kr
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

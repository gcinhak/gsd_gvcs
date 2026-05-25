import { useState } from 'react';
import PopcatPage from './PopcatPage';
import TerritoryPage from './TerritoryPage';

const TABS = [
    { key: 'popcat', label: '🐱 팝캣' },
    { key: 'territory', label: '🏰 점령전' },
];

export default function CheerHubPage() {
    const [tab, setTab] = useState('popcat');

    return (
        <div className="page cheer-hub-page">
            <div className="ch-inner">
                <header className="ch-header">
                    <div className="ch-header-text">
                        <div className="page-eyebrow">응원</div>
                        <h1 className="page-title">응원하기</h1>
                    </div>
                    <div className="ch-tabs">
                        {TABS.map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                className={`ch-tab ${tab === t.key ? 'active' : ''}`}
                                onClick={() => setTab(t.key)}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </header>

                <div className="ch-content">
                    {tab === 'popcat' && <PopcatPage embedded />}
                    {tab === 'territory' && <TerritoryPage />}
                </div>
            </div>
        </div>
    );
}

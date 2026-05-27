import TerritoryPage from './TerritoryPage';

export default function CheerHubPage() {
    return (
        <div className="page cheer-hub-page">
            <div className="ch-inner">
                <header className="ch-header">
                    <div className="ch-header-text">
                        <div className="page-eyebrow">CAMPUS WAR</div>
                        <h1 className="page-title">🏰 점령전</h1>
                    </div>
                </header>

                <div className="ch-content">
                    <TerritoryPage />
                </div>
            </div>
        </div>
    );
}

export default function PageHeader({ eyebrow, title, description, children }) {
    return (
        <div className="page-header">
            <div className="page-header-text">
                {eyebrow && <div className="page-eyebrow">{eyebrow}</div>}
                <h1 className="page-title">{title}</h1>
                {description && <p className="page-desc">{description}</p>}
            </div>
            {children && <div className="page-header-actions">{children}</div>}
        </div>
    );
}

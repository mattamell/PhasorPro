export default function DashboardPanel({ title, onClose, children }) {
  return (
    <section className="dashboard-panel">
      <div className="dashboard-panel-header">
        <button type="button" className="dashboard-drag-handle" aria-label={`Move ${title} panel`}>
          <span aria-hidden="true">::</span>
          {title}
        </button>
        <button type="button" className="dashboard-close-button" onClick={onClose} aria-label={`Close ${title}`}>
          X
        </button>
      </div>
      <div className="dashboard-panel-body">{children}</div>
    </section>
  );
}

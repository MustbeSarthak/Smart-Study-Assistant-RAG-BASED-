import { NavLink, Outlet } from 'react-router-dom'

export function AppShell() {
  return (
    <div className="app-shell">
      <BackgroundNumbers />
      <header className="topbar">
        <NavLink to="/study" className="brand">
          <span className="brand-mark">S</span>
          <span>
            <strong>Smart Study</strong>
            <small>RAG assistant</small>
          </span>
        </NavLink>
        <nav className="nav-links" aria-label="Main navigation">
          <NavLink to="/study" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Study</NavLink>
          <NavLink to="/files" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Files</NavLink>
          <NavLink to="/about" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>About</NavLink>
        </nav>
        <div className="status-pill"><span /> API ready</div>
      </header>
      <main className="page-wrap"><Outlet /></main>
    </div>
  )
}

function BackgroundNumbers() {
  const rows = [
    '01  10  11  100  101  110  111',
    'π  Σ  ∫  f(x)  →  Δ  2x + 1',
    '1010  0011  0110  1001  0101',
    'x² + y² = r²   •   E = mc²   •   n → ∞',
    '001  010  011  101  110  111',
    'A₁  A₂  A₃   [ 1  0 ]   [ 0  1 ]',
  ]

  return (
    <div className="number-field" aria-hidden="true">
      {rows.map((row, index) => (
        <span key={row} className={`number-row row-${index}`}>{row}</span>
      ))}
    </div>
  )
}

import React from 'react'

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="5"/>
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
)

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)

const Logo = () => (
  <svg
    viewBox="0 0 32 32"
    width="28"
    height="28"
    fill="none"
    aria-label="Football Bias Tracker logo"
    role="img"
  >
    {/* Football hex patch mark */}
    <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2"/>
    <polygon
      points="16,7 19.8,10.4 18.5,15 13.5,15 12.2,10.4"
      stroke="currentColor" strokeWidth="1.5" fill="none"
    />
    <line x1="16" y1="15" x2="16" y2="20" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="13.5" y1="15" x2="11" y2="19" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="18.5" y1="15" x2="21" y2="19" stroke="currentColor" strokeWidth="1.5"/>
    {/* Balance scale arm */}
    <line x1="7" y1="23" x2="25" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="16" y1="20" x2="16" y2="23" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="8" cy="23" r="1.5" fill="currentColor"/>
    <circle cx="24" cy="23" r="1.5" fill="currentColor"/>
  </svg>
)

export default function Nav({ theme, onThemeToggle, currentPage, onNavigate }) {
  const navItems = [
    { id: 'leaderboard', label: 'Rankings'    },
    { id: 'compare',     label: 'Compare'     },
    { id: 'methodology', label: 'Methodology' },
  ]

  return (
    <header className="app-header" role="banner">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <div className="header-inner">
        <a
          href="#"
          className="brand"
          onClick={e => { e.preventDefault(); onNavigate('') }}
          aria-label="Football Bias Tracker — home"
        >
          <Logo />
          <span className="brand-name">Bias<strong>Tracker</strong></span>
        </a>

        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map(item => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`nav-link${currentPage === item.id ? ' nav-link-active' : ''}`}
              aria-current={currentPage === item.id ? 'page' : undefined}
              onClick={e => { e.preventDefault(); onNavigate(item.id) }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <button
          className="theme-toggle"
          data-theme-toggle
          onClick={onThemeToggle}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </header>
  )
}

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
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-label="Football Bias Tracker logo">
    <circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M14 4 L18 10 L14 16 L10 10 Z" fill="currentColor" opacity="0.9"/>
    <path d="M14 16 L20 18 L18 24 L10 24 L8 18 Z" fill="currentColor" opacity="0.5"/>
    <circle cx="14" cy="14" r="2" fill="var(--color-bg)"/>
  </svg>
)

export default function Nav({ theme, onThemeToggle, currentPage, onNavigate }) {
  return (
    <header className="nav">
      <a href="#" className="nav-brand" onClick={e => { e.preventDefault(); onNavigate('') }} aria-label="Football Bias Tracker home">
        <Logo />
        <span className="nav-title">Bias Tracker</span>
      </a>
      <nav className="nav-links" aria-label="Primary navigation">
        <a
          href="#"
          className={`nav-link${currentPage === 'leaderboard' ? ' active' : ''}`}
          onClick={e => { e.preventDefault(); onNavigate('') }}
        >Rankings</a>
        <a
          href="#methodology"
          className={`nav-link${currentPage === 'methodology' ? ' active' : ''}`}
          onClick={e => { e.preventDefault(); onNavigate('methodology') }}
        >Methodology</a>
      </nav>
      <button
        className="theme-toggle"
        onClick={onThemeToggle}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>
    </header>
  )
}

import React, { useState, useEffect } from 'react'
import Nav from './components/Nav.jsx'
import LeaderboardPage from './components/LeaderboardPage.jsx'
import PlayerPage from './components/PlayerPage.jsx'
import MethodologyPage from './components/MethodologyPage.jsx'

function getRoute() {
  const hash = window.location.hash.replace('#', '') || ''
  if (hash.startsWith('player/')) return { page: 'player', slug: hash.replace('player/', '') }
  if (hash === 'methodology') return { page: 'methodology' }
  return { page: 'leaderboard' }
}

export default function App() {
  const [route, setRoute] = useState(getRoute())
  const [theme, setTheme] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    const onHash = () => setRoute(getRoute())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const navigate = (path) => {
    window.location.hash = path
  }

  return (
    <div className="app">
      <Nav
        theme={theme}
        onThemeToggle={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        currentPage={route.page}
        onNavigate={navigate}
      />
      <main id="main-content">
        {route.page === 'leaderboard' && <LeaderboardPage onNavigate={navigate} />}
        {route.page === 'player' && <PlayerPage slug={route.slug} onNavigate={navigate} />}
        {route.page === 'methodology' && <MethodologyPage onNavigate={navigate} />}
      </main>
    </div>
  )
}

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const ThemeContext = createContext()

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export function ThemeProvider({ children }) {
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      return savedTheme
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'light'
  }

  const [theme, setTheme] = useState(getInitialTheme)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(theme)
    
    // Store in localStorage
    localStorage.setItem('theme', theme)
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      const colors = {
        light: '#ffffff',
        dark: '#0f0f1a'
      }
      metaThemeColor.setAttribute('content', colors[theme] || '#ffffff')
    }
  }, [theme])

  const toggleTheme = useCallback(() => {
    setIsTransitioning(true)
    document.documentElement.classList.add('theme-transition')
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light')
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition')
      setIsTransitioning(false)
    }, 300)
  }, [])

  const setThemeDirectly = useCallback((newTheme) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      setTheme(newTheme)
    }
  }, [])

  const isDark = useCallback(() => theme === 'dark', [theme])
  const isLight = useCallback(() => theme === 'light', [theme])
  const getThemeName = useCallback(() => theme, [theme])

  const value = {
    theme,
    isDark,
    isLight,
    getThemeName,
    toggleTheme,
    setTheme: setThemeDirectly,
    isTransitioning
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export default ThemeContext
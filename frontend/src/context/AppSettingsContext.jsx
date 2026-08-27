import React, { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'

const AppSettingsContext = createContext({ schoolName: 'Kinder Park Preschool', memberPrefix: 'KP', memberLabel: 'KP Member', membersLabel: 'KP Members', refreshSettings: () => {} })

export function AppSettingsProvider({ children }) {
  const [schoolName, setSchoolName] = useState('Kinder Park Preschool')
  const [memberPrefix, setMemberPrefix] = useState('KP')

  const prefixFromName = (name) => (name || 'Member')
    .trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map((word) => word[0]).join('').toUpperCase() || 'MB'

  const refreshSettings = async () => {
    try {
      const response = await api.get('/settings/public')
      const configuredName = response.data?.school_name || 'Kinder Park Preschool'
      setSchoolName(configuredName)
      setMemberPrefix(prefixFromName(configuredName))
    } catch (_) {
      // Keep the safe default while the backend is unavailable.
    }
  }

  useEffect(() => {
    refreshSettings()
    window.addEventListener('app-settings-updated', refreshSettings)
    return () => window.removeEventListener('app-settings-updated', refreshSettings)
  }, [])

  const memberLabel = `${memberPrefix} Member`
  const membersLabel = `${memberPrefix} Members`
  return <AppSettingsContext.Provider value={{ schoolName, memberPrefix, memberLabel, membersLabel, refreshSettings }}>{children}</AppSettingsContext.Provider>
}

export const useAppSettings = () => useContext(AppSettingsContext)

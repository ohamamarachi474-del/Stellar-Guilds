'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

type Theme = 'light' | 'dark'

const icons: Record<Theme, React.ReactNode> = {
  light: <Sun size={18} className="text-yellow-500" />,
  dark: <Moon size={18} className="text-slate-300" />,
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isRotating, setIsRotating] = useState(false)

  useEffect(() => setMounted(true), [])

  // Render neutral placeholder until hydrated to avoid mismatch
  if (!mounted) return <div className="w-9 h-9" />

  const current = (theme === 'light' ? 'light' : 'dark') as Theme
  const next: Theme = current === 'light' ? 'dark' : 'light'

  const handleThemeChange = () => {
    setIsRotating(true)
    setTheme(next)
    setTimeout(() => setIsRotating(false), 300)
  }

  return (
    <button
      onClick={handleThemeChange}
      aria-label={`Current theme: ${current}. Switch to ${next}`}
      className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-stellar-lightNavy transition-colors"
    >
      <div className={`transition-transform duration-300 ${isRotating ? 'rotate-180' : ''}`}>
        {icons[current]}
      </div>
    </button>
  )
}

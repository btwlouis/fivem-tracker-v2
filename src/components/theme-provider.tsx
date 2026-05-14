"use client"

import * as React from "react"

type Theme = "light" | "dark" | "system"
type ResolvedTheme = "light" | "dark"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  enableSystem?: boolean
  storageKey?: string
}

type ThemeContextValue = {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null)

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function resolveTheme(theme: Theme, enableSystem: boolean): ResolvedTheme {
  return theme === "system" && enableSystem ? getSystemTheme() : theme === "light" ? "light" : "dark"
}

function applyTheme(theme: ResolvedTheme) {
  const root = document.documentElement
  root.classList.toggle("dark", theme === "dark")
  root.style.colorScheme = theme
}

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  enableSystem = true,
  storageKey = "theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme

    const storedTheme = window.localStorage.getItem(storageKey) as Theme | null

    if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") {
      return storedTheme
    }

    return defaultTheme
  })
  const [systemTheme, setSystemTheme] = React.useState<ResolvedTheme>(() => getSystemTheme())
  const resolvedTheme = theme === "system" && enableSystem ? systemTheme : resolveTheme(theme, enableSystem)

  React.useEffect(() => {
    applyTheme(resolvedTheme)
  }, [resolvedTheme])

  React.useEffect(() => {
    if (!enableSystem) return

    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => {
      setSystemTheme(getSystemTheme())
    }

    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [enableSystem, theme])

  React.useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return
      const nextTheme = event.newValue as Theme | null

      if (nextTheme === "light" || nextTheme === "dark" || nextTheme === "system") {
        setThemeState(nextTheme)
      }
    }

    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [storageKey])

  const setTheme = React.useCallback(
    (nextTheme: Theme) => {
      setThemeState(nextTheme)
      window.localStorage.setItem(storageKey, nextTheme)
    },
    [storageKey]
  )

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [resolvedTheme, setTheme, theme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = React.useContext(ThemeContext)

  if (!context) {
    return {
      theme: "dark" as Theme,
      resolvedTheme: "dark" as ResolvedTheme,
      setTheme: () => {},
    }
  }

  return context
}

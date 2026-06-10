"use client";

import { createContext, useContext, useSyncExternalStore, ReactNode } from "react";
import { useRouter } from "next/navigation";
import en from "@/locales/en.json";
import de from "@/locales/de.json";
import es from "@/locales/es.json";
import fr from "@/locales/fr.json";
import it from "@/locales/it.json";

export type Locale = "en" | "de" | "es" | "fr" | "it";

const translations = { en, de, es, fr, it } as const;
const supportedLocales = ["en", "de", "es", "fr", "it"] as const;

function isSupportedLocale(value: string | null): value is Locale {
  return supportedLocales.includes(value as Locale);
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
});

const localeListeners = new Set<() => void>();

function resolve(obj: Record<string, unknown>, path: string): string {
  const result = path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
  return typeof result === "string" ? result : path;
}

function getBrowserLocale(): Locale {
  if (typeof window === "undefined") {
    return "de";
  }

  const stored = window.localStorage.getItem("locale") as Locale | null;
  if (isSupportedLocale(stored)) {
    return stored;
  }

  const lang = window.navigator.language.split("-")[0];
  return isSupportedLocale(lang) ? lang : "en";
}

function subscribe(listener: () => void) {
  localeListeners.add(listener);
  return () => localeListeners.delete(listener);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const locale = useSyncExternalStore<Locale>(
    subscribe,
    getBrowserLocale,
    (): Locale => "de"
  );

  const setLocale = (next: Locale) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("locale", next);
      document.cookie = `locale=${next}; path=/; max-age=31536000; samesite=lax`;
    }

    localeListeners.forEach((listener) => listener());
    router.refresh();
  };

  const t = (key: string, vars?: Record<string, string | number>): string => {
    const raw = resolve(translations[locale] as Record<string, unknown>, key);
    if (!vars) return raw;
    return raw.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? `{{${k}}}`));
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}

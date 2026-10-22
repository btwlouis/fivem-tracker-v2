# FiveM Tracker

Next.js-Anwendung mit einer FiveM-Serverliste, Spielerstatistiken und PostgreSQL über Prisma.

## Voraussetzungen und Start

- Node.js 22 ab 22.12 oder Node.js ab 24; das Deployment verwendet Node.js 22.
- PostgreSQL mit dem Schema aus `prisma/schema.prisma`.
- Eine lokale `.env` mit `DATABASE_URL`. Für den geschützten Import-Endpunkt wird außerdem `CRON_SECRET` benötigt.

```bash
npm ci
npm run dev
```

Die Anwendung läuft unter http://localhost:3000. `npm ci` generiert den Prisma-Client automatisch, verändert aber kein Datenbankschema.

Optionale Umgebungsvariablen:

- `NEXT_PUBLIC_BASE_URL`: öffentliche Basis-URL für Metadaten und Sitemap.
- `NEXT_PUBLIC_PLAUSIBLE_HOST` und `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`: Plausible-Einbindung.
- `DEBUG_SECRET`: eigener Zugriffstoken für `/debug/db`; sonst wird `CRON_SECRET` verwendet.

## Prüfung und Produktion

```bash
npm run lint
npm run typecheck
npm run build
npm start
```

Der Produktionsbuild rendert die Startseite vor und benötigt deshalb eine erreichbare, eingerichtete Datenbank. Die Schriftarten werden beim Build von Google Fonts geladen.

## Abhängigkeiten aktualisieren

Stand der Aktualisierung: 22. Oktober 2026. Next.js-Pakete sind auf 16.4.2 abgestimmt, React auf 19.3.1, Prisma auf 7.10.1 und TanStack Table auf 9.3.1 migriert.

- Prisma-CLI, Client und PostgreSQL-Adapter gemeinsam aktualisieren. Prisma 8 ist derzeit eine Vorabversion und wird nicht installiert.
- TypeScript bleibt auf 6.0.3, da `typescript-eslint` TypeScript 7 noch nicht unterstützt. Siehe [unterstützte Versionen](https://typescript-eslint.io/users/dependency-versions/).
- ESLint bleibt auf 9.39.5, da die von `eslint-config-next` verwendeten React-, Import- und Accessibility-Plugins ESLint 10 noch nicht in ihren Peer-Abhängigkeiten zulassen.
- Die Node-Typen folgen der Node.js-22-Laufzeit des Deployments.

Nach Updates die obigen Prüfungen sowie `npm audit` und `npm audit --omit=dev` ausführen. Für die transitive Entwicklungsabhängigkeit `braces` existiert derzeit kein veröffentlichter Fix für [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). `npm audit fix --force` schlägt hier inkompatible Downgrades von shadcn beziehungsweise Next.js vor. shadcn wird als Entwicklungs- und Build-Abhängigkeit geführt; dessen CSS wird beim Build eingebunden.

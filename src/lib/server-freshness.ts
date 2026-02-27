const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * ONE_DAY_MS;

export function getVisibleHistoryCutoffDate() {
  return new Date(Date.now() - ONE_DAY_MS);
}

export function getRetentionHistoryCutoffDate() {
  return new Date(Date.now() - THIRTY_DAYS_MS);
}

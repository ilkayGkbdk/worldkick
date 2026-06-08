export function formatLocalTime(isoUtc, locale = 'tr-TR', timeZone = undefined) {
  return new Date(isoUtc).toLocaleTimeString(locale, {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone,
  });
}

export function formatLocalDate(isoUtc, locale = 'tr-TR', timeZone = undefined) {
  return new Date(isoUtc).toLocaleDateString(locale, {
    weekday: 'long', day: 'numeric', month: 'long', timeZone,
  });
}

export function isSameLocalDay(isoUtc, ref = new Date(), timeZone = undefined) {
  const fmt = (d) => d.toLocaleDateString('en-CA', { timeZone }); // YYYY-MM-DD
  return fmt(new Date(isoUtc)) === fmt(ref);
}

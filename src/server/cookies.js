export function getCookie(req, name) {
  const header = req.headers?.cookie || req.headers?.Cookie || '';
  for (const part of String(header).split(';')) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    if (key === name) {
      return decodeURIComponent(trimmed.slice(eq + 1));
    }
  }
  return '';
}

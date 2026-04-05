/**
 * Resuelve el id del incidente desde Expo Router y el store (evita "undefined" en la URL).
 */
export function resolveIncidentId(routeId, activeIncidentId, activeIncident) {
  const raw = Array.isArray(routeId) ? routeId[0] : routeId;
  const s = raw != null ? String(raw).trim() : '';
  if (s && s !== 'undefined') return s;
  if (activeIncidentId != null) return String(activeIncidentId);
  if (activeIncident?.id != null) return String(activeIncident.id);
  if (activeIncident?.pk != null) return String(activeIncident.pk);
  return null;
}

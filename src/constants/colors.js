export const COLORS = {
  primary: '#ef4444',
  primaryDark: '#dc2626',
  primaryLight: '#f87171',

  secondary: '#3b82f6',
  secondaryDark: '#2563eb',

  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  background: '#ffffff',
  backgroundDark: '#0f172a',
  surface: '#f8fafc',
  surfaceDark: '#1e293b',

  text: '#0f172a',
  textLight: '#64748b',
  textDark: '#f8fafc',

  border: '#e2e8f0',
  borderDark: '#334155',

  white: '#ffffff',
  black: '#000000',

  // Status colors
  pending: '#f59e0b',
  analyzing: '#3b82f6',
  waiting: '#8b5cf6',
  assigned: '#06b6d4',
  inProgress: '#10b981',
  completed: '#10b981',
  cancelled: '#6b7280',

  // Priority colors
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#7f1d1d',
};

export const STATUS_COLORS = {
  pending: COLORS.pending,
  analyzing: COLORS.analyzing,
  waiting_workshop: COLORS.waiting,
  assigned: COLORS.assigned,
  in_progress: COLORS.inProgress,
  completed: COLORS.completed,
  cancelled: COLORS.cancelled,
};

export const PRIORITY_COLORS = {
  low: COLORS.low,
  medium: COLORS.medium,
  high: COLORS.high,
  critical: COLORS.critical,
};

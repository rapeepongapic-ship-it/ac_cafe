export const colors = {
  bg: '#FFF8F0',
  bgCard: '#FFFFFF',
  bgInput: '#F5EFE6',
  bgSection: '#FDF4E7',
  border: '#E8D5B7',
  text: '#1A1A1A',
  textSecondary: '#6B5B45',
  textMuted: '#9C8670',
  accent: '#8B5E3C',
  accentLight: '#C4956A',
  danger: '#C0392B',
  success: '#27AE60',
  tabActive: '#8B5E3C',
  tabInactive: '#B8A89A',
  tableHeader: '#F0E4D0',
  summaryRow: '#F5EFE6',
};

export const typography = {
  heading: { fontSize: 22, fontWeight: '700' as const, color: colors.text },
  subheading: { fontSize: 16, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 14, color: colors.text },
  small: { fontSize: 12, color: colors.textSecondary },
  label: { fontSize: 13, fontWeight: '600' as const, color: colors.textSecondary },
};

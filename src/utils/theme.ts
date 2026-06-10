export const colors = {
  // Backgrounds — warm ivory cream
  bg: '#FFF8F0',
  bgCard: '#FFFCF8',
  bgInput: '#F5EDE0',
  bgSection: '#FDF4E7',

  // Borders
  border: '#E8D5B7',
  borderLight: '#F0E4D0',

  // Text — warm brown scale (contrast-checked on cream bg)
  text: '#2D1B0E',          // 13:1 on bg ✓
  textSecondary: '#6B4C2A', // 5.5:1 ✓
  textMuted: '#9C7A5A',     // 3.1:1 (icons/placeholders only)

  // Accent — caramel brown
  accent: '#8B5E3C',        // 5.1:1 on bg ✓
  accentPressed: '#6B4226',
  accentLight: '#C4956A',

  // Semantic
  danger: '#B91C1C',
  dangerBg: '#FEE2E2',
  success: '#166534',
  successBg: '#DCFCE7',

  // Nav
  tabActive: '#8B5E3C',
  tabInactive: '#C4A882',

  // Table
  tableHeader: '#F0E4D0',
  summaryRow: '#FDF4E7',
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const shadow = {
  sm: {
    shadowColor: '#8B5E3C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#8B5E3C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const typography = {
  heading: { fontSize: 22, fontWeight: '700' as const, color: colors.text, letterSpacing: -0.3 },
  subheading: { fontSize: 17, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.text, lineHeight: 22 },
  small: { fontSize: 13, fontWeight: '400' as const, color: colors.textSecondary, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: '600' as const, color: colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' as const },
};

// 8dp spacing scale
export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

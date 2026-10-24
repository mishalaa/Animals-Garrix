// Visual system: modern, high-contrast pet health & wellness aesthetic
// Warm porcelain background, radiant coral primary, obsidian charcoal ink, and harmonious clinical pastels.

export const colors = {
  bg: '#F8FAF9',
  surface: '#FFFFFF',
  surfaceHover: '#F4F6F8',
  peach: '#FFEFE9',
  peachSoft: '#FFF7F4',
  primary: '#FF5E48',
  primaryDark: '#D94532',
  primarySoft: '#FFF0ED',
  ink: '#1A1D20',
  inkSoft: '#3E444A',
  muted: '#717D8A',
  border: '#E8ECEF',
  borderLight: '#F2F4F6',
  lavender: '#F0ECFE',
  lavenderInk: '#5D46D6',
  mint: '#E4F6EC',
  mintInk: '#0E7A4A',
  butter: '#FEF6E1',
  butterInk: '#946300',
  sky: '#E8F3FF',
  skyInk: '#1B6DC9',
  danger: '#E53935',
  dangerSoft: '#FEECEC',
  white: '#FFFFFF',
} as const;

export const radius = { sm: 12, md: 18, lg: 24, xl: 32, pill: 999 } as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const shadow = {
  shadowColor: '#0F172A',
  shadowOpacity: 0.05,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const;

export const shadowLg = {
  shadowColor: '#0F172A',
  shadowOpacity: 0.09,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 8 },
  elevation: 4,
} as const;

// Harmonious pastel pairs used for pet tiles and stat chips (background, foreground).
export const pastel = [
  { bg: colors.mint, fg: colors.mintInk },
  { bg: colors.peach, fg: colors.primaryDark },
  { bg: colors.sky, fg: colors.skyInk },
  { bg: colors.lavender, fg: colors.lavenderInk },
  { bg: colors.butter, fg: colors.butterInk },
] as const;

export function pastelFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return pastel[h % pastel.length];
}

// Content width cap so the web app reads like a phone app on large screens.
export const MAX_WIDTH = 520;


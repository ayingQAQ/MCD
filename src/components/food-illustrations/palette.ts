/** Shared solid inks. No filters, remote paint servers, or photographic textures. */
export const illustrationPalette = {
  outline: '#684536', outlineSoft: '#AF7D5D', bunLight: '#F9CB83', bunDark: '#E6A45B', bunInside: '#FFE5AA',
  cheese: '#FFD864', lettuce: '#8BCB76', lettuceShadow: '#64A95F', beef: '#915A43', beefLight: '#B67B59',
  chicken: '#D99555', chickenLight: '#F2BF71', fries: '#FFD66B', friesShadow: '#F2B74E',
  red: '#ED766C', redShadow: '#D35E58', pink: '#F4A9B5', cream: '#FFF3D8', white: '#FFFDF5',
  blue: '#8CCCE8', blueShadow: '#60AFCB', green: '#A4D6A0', purple: '#C7B2E9',
  chocolate: '#785043', coffee: '#A37555', tea: '#D8A260', lemon: '#F3D88A', egg: '#F7BE51',
  bacon: '#CB7863', baconFat: '#F7D4B2', shadow: '#DFC3A0', wrapper: '#F3DEB1',
} as const;
export type IllustrationPalette = typeof illustrationPalette;

/**
 * Standard IBM PC 16-color VGA/EGA Palette
 */
export const VGA_PALETTE = [
  '#000000', // 0: Black
  '#0000AA', // 1: Blue
  '#00AA00', // 2: Green
  '#00AAAA', // 3: Cyan
  '#AA0000', // 4: Red
  '#AA00AA', // 5: Magenta
  '#AA5500', // 6: Brown
  '#AAAAAA', // 7: Light Gray
  '#555555', // 8: Dark Gray
  '#5555FF', // 9: Bright Blue
  '#55FF55', // 10: Bright Green
  '#55FFFF', // 11: Bright Cyan
  '#FF5555', // 12: Bright Red
  '#FF55FF', // 13: Bright Magenta
  '#FFFF55', // 14: Yellow
  '#FFFFFF', // 15: Bright White
] as const;

export type VgaColorIndex = number; // 0 - 15

export interface CellAttribute {
  fg: VgaColorIndex;
  bg: VgaColorIndex;
  bold: boolean;
  blink: boolean;
  reverse: boolean;
  underline: boolean;
}

export interface TerminalCell {
  char: string;
  fg: VgaColorIndex;
  bg: VgaColorIndex;
  bold: boolean;
  blink: boolean;
  reverse: boolean;
  underline: boolean;
}

export interface CursorPosition {
  row: number; // 0-indexed (0 to 24)
  col: number; // 0-indexed (0 to 79)
  visible: boolean;
}

export const TERMINAL_COLS = 80;
export const TERMINAL_ROWS = 25;

export type MonitorTheme = 'vga' | 'amber' | 'green' | 'cga';

export interface TerminalOptions {
  cols?: number;
  rows?: number;
  theme?: MonitorTheme;
  crtScanlines?: boolean;
  crtCurvature?: boolean;
  crtBloom?: boolean;
  crtFlicker?: boolean;
  baudRate?: number; // 0 = instant, otherwise simulated cps
}

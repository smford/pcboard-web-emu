/**
 * Code Page 437 (IBM PC) character mapping table.
 * Maps bytes 0x00 to 0xFF to corresponding Unicode characters.
 */
export const CP437_TABLE: string[] = [
  // 0x00 - 0x0F
  '\u0000', '☺', '☻', '♥', '♦', '♣', '♠', '•', '◘', '○', '◙', '♂', '♀', '♪', '♫', '☼',
  // 0x10 - 0x1F
  '►', '◄', '↕', '‼', '¶', '§', '▬', '↨', '↑', '↓', '→', '←', '∟', '↔', '▲', '▼',
  // 0x20 - 0x2F (Standard ASCII printable)
  ' ', '!', '"', '#', '$', '%', '&', '\'', '(', ')', '*', '+', ',', '-', '.', '/',
  // 0x30 - 0x3F
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ':', ';', '<', '=', '>', '?',
  // 0x40 - 0x4F
  '@', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
  // 0x50 - 0x5F
  'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '[', '\\', ']', '^', '_',
  // 0x60 - 0x6F
  '`', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o',
  // 0x70 - 0x7F
  'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '{', '|', '}', '~', '⌂',
  // 0x80 - 0x8F (Extended ASCII)
  'Ç', 'ü', 'é', 'â', 'ä', 'à', 'å', 'ç', 'ê', 'ë', 'è', 'ï', 'î', 'ì', 'Ä', 'Å',
  // 0x90 - 0x9F
  'É', 'æ', 'Æ', 'ô', 'ö', 'ò', 'û', 'ù', 'ÿ', 'Ö', 'Ü', '¢', '£', '¥', '₧', 'ƒ',
  // 0xA0 - 0xAF
  'á', 'í', 'ó', 'ú', 'ñ', 'Ñ', 'ª', 'º', '¿', '⌐', '¬', '½', '¼', '¡', '«', '»',
  // 0xB0 - 0xBF (Box drawing: light shading, medium shading, dark shading, single borders)
  '░', '▒', '▓', '│', '┤', '╡', '╢', '╖', '╕', '╣', '║', '╗', '╝', '╜', '╛', '┐',
  // 0xC0 - 0xCF (Box drawing: corners, junctions, double borders)
  '└', '┴', '┬', '├', '─', '┼', '╞', '╟', '╚', '╔', '╩', '╦', '╠', '═', '╬', '╧',
  // 0xD0 - 0xDF (Box drawing junctions and blocks)
  '╨', '╤', '╥', '╙', '╘', '╒', '╓', '╫', '╪', '┘', '┌', '█', '▄', '▌', '▐', '▀',
  // 0xE0 - 0xEF (Greek & math)
  'α', 'ß', 'Γ', 'π', 'Σ', 'σ', 'µ', 'τ', 'Φ', 'Θ', 'Ω', 'δ', '∞', 'φ', 'ε', '∩',
  // 0xF0 - 0xFF (Math, symbols, non-breaking space)
  '≡', '±', '≥', '≤', '⌠', '⌡', '÷', '≈', '°', '∙', '·', '√', 'ⁿ', '²', '■', '\u00A0',
];

/**
 * Reverse mapping from Unicode character to CP437 byte value.
 */
export const UNICODE_TO_CP437 = new Map<string, number>();
CP437_TABLE.forEach((char, index) => {
  UNICODE_TO_CP437.set(char, index);
});
// Also map standard space to 0x20
UNICODE_TO_CP437.set(' ', 0x20);

/**
 * Check if a character is a CP437 box-drawing or block character that benefits
 * from seamless edge-to-edge drawing.
 */
export function isBoxOrBlockChar(char: string): boolean {
  const code = char.charCodeAt(0);
  // Box drawing: U+2500 - U+257F
  // Block elements: U+2580 - U+259F
  return (code >= 0x2500 && code <= 0x259F) ||
    ['│', '┤', '╡', '╢', '╖', '╕', '╣', '║', '╗', '╝', '╜', '╛', '┐',
     '└', '┴', '┬', '├', '─', '┼', '╞', '╟', '╚', '╔', '╩', '╦', '╠', '═', '╬', '╧',
     '╨', '╤', '╥', '╙', '╘', '╒', '╓', '╫', '╪', '┘', '┌',
     '█', '▄', '▌', '▐', '▀', '░', '▒', '▓', '■'].includes(char);
}

/**
 * Convert an array of CP437 bytes to a JavaScript string.
 */
export function cp437BytesToString(bytes: Uint8Array | number[]): string {
  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    result += CP437_TABLE[byte] || '?';
  }
  return result;
}

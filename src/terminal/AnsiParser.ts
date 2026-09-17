import { TextBuffer } from './TextBuffer';
import { VgaColorIndex } from './types';

// Standard ANSI 30-37 color mapping to VGA palette indices:
// ANSI: 0=black, 1=red, 2=green, 3=yellow, 4=blue, 5=magenta, 6=cyan, 7=white
const ANSI_TO_VGA_NORMAL: VgaColorIndex[] = [
  0, // 30: Black
  4, // 31: Red
  2, // 32: Green
  6, // 33: Brown / Dark Yellow
  1, // 34: Blue
  5, // 35: Magenta
  3, // 36: Cyan
  7, // 37: Light Gray / White
];

const ANSI_TO_VGA_BRIGHT: VgaColorIndex[] = [
  8,  // 90: Dark Gray
  12, // 91: Bright Red
  10, // 92: Bright Green
  14, // 93: Yellow
  9,  // 94: Bright Blue
  13, // 95: Bright Magenta
  11, // 96: Bright Cyan
  15, // 97: Bright White
];

export interface AnsiParserOptions {
  onBell?: () => void;
  enablePcboardCodes?: boolean;
}

export class AnsiParser {
  private buffer: TextBuffer;
  private onBell?: () => void;
  private enablePcboardCodes: boolean;

  constructor(buffer: TextBuffer, options: AnsiParserOptions = {}) {
    this.buffer = buffer;
    this.onBell = options.onBell;
    this.enablePcboardCodes = options.enablePcboardCodes ?? true;
  }

  public setOnBell(callback: () => void): void {
    this.onBell = callback;
  }

  /**
   * Process a string containing ANSI escape codes, PCBoard codes, and normal text.
   */
  public parse(input: string): void {
    let i = 0;
    const len = input.length;

    while (i < len) {
      const char = input[i];

      // Bell character
      if (char === '\x07') {
        if (this.onBell) this.onBell();
        i++;
        continue;
      }

      // ANSI Escape sequence start: ESC [
      if (char === '\x1b' && i + 1 < len && input[i + 1] === '[') {
        const csiStart = i + 2;
        let csiEnd = csiStart;

        // Find terminator character (A-Z, a-z, etc.)
        while (csiEnd < len && !/[a-zA-Z]/.test(input[csiEnd])) {
          csiEnd++;
        }

        if (csiEnd < len) {
          const command = input[csiEnd];
          const paramStr = input.slice(csiStart, csiEnd);
          this.executeCsiCommand(command, paramStr);
          i = csiEnd + 1;
          continue;
        }
      }

      // PCBoard @X color codes: @Xbg (where b=bg hex 0-7, g=fg hex 0-F)
      if (this.enablePcboardCodes && char === '@') {
        // Escaped @@ -> single @
        if (i + 1 < len && input[i + 1] === '@') {
          this.buffer.writeChar('@');
          i += 2;
          continue;
        }

        // @X0E -> background 0, foreground E (Yellow)
        if (i + 3 < len && (input[i + 1] === 'X' || input[i + 1] === 'x')) {
          const bgHex = input[i + 2];
          const fgHex = input[i + 3];

          const bgVal = parseInt(bgHex, 16);
          const fgVal = parseInt(fgHex, 16);

          if (!isNaN(bgVal) && !isNaN(fgVal)) {
            // Background is 0-7 (or 0-15 if blinking not used)
            const safeBg = (bgVal % 8) as VgaColorIndex;
            const safeFg = fgVal as VgaColorIndex;
            const isBold = safeFg >= 8;

            this.buffer.setAttributes({
              bg: safeBg,
              fg: safeFg,
              bold: isBold,
            });

            i += 4;
            continue;
          }
        }

        // Check for @CLS@
        if (input.startsWith('@CLS@', i)) {
          this.buffer.clearScreen(true);
          i += 5;
          continue;
        }
      }

      // Normal character
      this.buffer.writeChar(char);
      i++;
    }
  }

  private executeCsiCommand(command: string, paramStr: string): void {
    const params = paramStr.length > 0 ? paramStr.split(';').map(p => parseInt(p, 10)) : [];

    switch (command) {
      case 'm': // SGR (Select Graphic Rendition)
        this.handleSgr(params);
        break;

      case 'H': // Cursor Position: row;col (1-indexed)
      case 'f':
        {
          const row = (params[0] && !isNaN(params[0]) ? params[0] : 1) - 1;
          const col = (params[1] && !isNaN(params[1]) ? params[1] : 1) - 1;
          this.buffer.setCursor(row, col);
        }
        break;

      case 'A': // Cursor Up
        {
          const count = params[0] && !isNaN(params[0]) ? params[0] : 1;
          this.buffer.moveCursor(-count, 0);
        }
        break;

      case 'B': // Cursor Down
        {
          const count = params[0] && !isNaN(params[0]) ? params[0] : 1;
          this.buffer.moveCursor(count, 0);
        }
        break;

      case 'C': // Cursor Forward (Right)
        {
          const count = params[0] && !isNaN(params[0]) ? params[0] : 1;
          this.buffer.moveCursor(0, count);
        }
        break;

      case 'D': // Cursor Backward (Left)
        {
          const count = params[0] && !isNaN(params[0]) ? params[0] : 1;
          this.buffer.moveCursor(0, -count);
        }
        break;

      case 'J': // Erase in Display
        {
          const mode = params[0] || 0;
          if (mode === 2) {
            this.buffer.clearScreen(true);
          } else if (mode === 0) {
            this.buffer.clearToEndOfScreen();
          }
        }
        break;

      case 'K': // Erase in Line
        {
          const mode = params[0] || 0;
          if (mode === 0) {
            this.buffer.clearToEndOfLine();
          } else if (mode === 2) {
            this.buffer.clearLine();
          }
        }
        break;

      case 's': // Save cursor position
        this.buffer.saveCursor();
        break;

      case 'u': // Restore cursor position
        this.buffer.restoreCursor();
        break;

      case 'h': // Set Mode
        if (paramStr === '?25') {
          this.buffer.setCursorVisibility(true);
        }
        break;

      case 'l': // Reset Mode
        if (paramStr === '?25') {
          this.buffer.setCursorVisibility(false);
        }
        break;

      default:
        // Ignore unrecognized sequence
        break;
    }
  }

  private handleSgr(params: number[]): void {
    if (params.length === 0) {
      this.buffer.resetAttributes();
      return;
    }

    const current = this.buffer.getAttributes();

    for (const code of params) {
      if (isNaN(code) || code === 0) {
        this.buffer.resetAttributes();
        current.fg = 7;
        current.bg = 0;
        current.bold = false;
        current.blink = false;
        current.reverse = false;
        current.underline = false;
      } else if (code === 1) {
        current.bold = true;
        if (current.fg < 8) {
          current.fg = (current.fg + 8) as VgaColorIndex;
        }
      } else if (code === 2) {
        current.bold = false;
        if (current.fg >= 8) {
          current.fg = (current.fg - 8) as VgaColorIndex;
        }
      } else if (code === 4) {
        current.underline = true;
      } else if (code === 5) {
        current.blink = true;
      } else if (code === 7) {
        current.reverse = true;
      } else if (code === 22) {
        current.bold = false;
        if (current.fg >= 8) {
          current.fg = (current.fg - 8) as VgaColorIndex;
        }
      } else if (code === 24) {
        current.underline = false;
      } else if (code === 25) {
        current.blink = false;
      } else if (code === 27) {
        current.reverse = false;
      } else if (code >= 30 && code <= 37) {
        // Standard ANSI Foreground
        const baseIndex = code - 30;
        current.fg = current.bold
          ? ANSI_TO_VGA_BRIGHT[baseIndex]
          : ANSI_TO_VGA_NORMAL[baseIndex];
      } else if (code === 39) {
        current.fg = 7;
      } else if (code >= 40 && code <= 47) {
        // Standard ANSI Background
        const baseIndex = code - 40;
        current.bg = ANSI_TO_VGA_NORMAL[baseIndex];
      } else if (code === 49) {
        current.bg = 0;
      } else if (code >= 90 && code <= 97) {
        // High intensity foreground
        current.fg = ANSI_TO_VGA_BRIGHT[code - 90];
      } else if (code >= 100 && code <= 107) {
        // High intensity background
        current.bg = ANSI_TO_VGA_NORMAL[code - 100];
      }
    }

    this.buffer.setAttributes(current);
  }
}

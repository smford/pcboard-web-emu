import { TextBuffer } from './TextBuffer';
import {
  VGA_PALETTE,
  TERMINAL_COLS,
  TERMINAL_ROWS,
  MonitorTheme,
  TerminalOptions,
} from './types';

// Green phosphor and Amber phosphor palettes for monochrome modes
const GREEN_PALETTE = VGA_PALETTE.map((_, i) => {
  if (i === 0) return '#081208';
  const intensity = Math.min(255, 30 + i * 15);
  return `rgb(0, ${intensity}, 0)`;
});

const AMBER_PALETTE = VGA_PALETTE.map((_, i) => {
  if (i === 0) return '#140c00';
  const intensity = Math.min(255, 35 + i * 14);
  const red = intensity;
  const green = Math.round(intensity * 0.65);
  return `rgb(${red}, ${green}, 0)`;
});

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private buffer: TextBuffer;

  readonly charWidth = 9;
  readonly charHeight = 16;
  readonly width: number;
  readonly height: number;

  private theme: MonitorTheme = 'vga';
  private crtScanlines = true;
  private crtCurvature = false;
  private crtBloom = true;

  private cursorVisibleState = true;
  private lastCursorBlink = 0;
  private animationFrameId: number | null = null;

  constructor(canvas: HTMLCanvasElement, buffer: TextBuffer, options: TerminalOptions = {}) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      throw new Error('Unable to acquire 2D canvas context');
    }
    this.ctx = ctx;
    this.buffer = buffer;

    this.width = TERMINAL_COLS * this.charWidth; // 720
    this.height = TERMINAL_ROWS * this.charHeight; // 400

    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.theme = options.theme || 'vga';
    if (options.crtScanlines !== undefined) this.crtScanlines = options.crtScanlines;
    if (options.crtCurvature !== undefined) this.crtCurvature = options.crtCurvature;
    if (options.crtBloom !== undefined) this.crtBloom = options.crtBloom;

    // Redraw whenever the buffer changes
    this.buffer.addChangeListener(() => {
      this.render();
    });

    this.startRenderLoop();
  }

  public setTheme(theme: MonitorTheme): void {
    this.theme = theme;
    this.render();
  }

  public getTheme(): MonitorTheme {
    return this.theme;
  }

  public setCrtScanlines(enable: boolean): void {
    this.crtScanlines = enable;
    this.render();
  }

  public getCrtScanlines(): boolean {
    return this.crtScanlines;
  }

  public setCrtCurvature(enable: boolean): void {
    this.crtCurvature = enable;
    this.render();
  }

  public getCrtCurvature(): boolean {
    return this.crtCurvature;
  }

  public setCrtBloom(enable: boolean): void {
    this.crtBloom = enable;
    this.render();
  }

  public getCrtBloom(): boolean {
    return this.crtBloom;
  }

  private getColor(index: number): string {
    const safeIdx = Math.max(0, Math.min(15, index));
    if (this.theme === 'green') return GREEN_PALETTE[safeIdx];
    if (this.theme === 'amber') return AMBER_PALETTE[safeIdx];
    return VGA_PALETTE[safeIdx];
  }

  public render(): void {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;

    // Draw background grid
    for (let r = 0; r < this.buffer.rows; r++) {
      for (let c = 0; c < this.buffer.cols; c++) {
        const cell = this.buffer.getCell(r, c);
        const x = c * this.charWidth;
        const y = r * this.charHeight;

        const bg = cell ? cell.bg : 0;
        ctx.fillStyle = this.getColor(bg);
        ctx.fillRect(x, y, this.charWidth, this.charHeight);

        if (cell && cell.char && cell.char !== ' ') {
          this.drawCellChar(cell.char, x, y, cell.fg);
        }
      }
    }

    // Draw cursor
    const cursor = this.buffer.getCursor();
    if (cursor.visible && this.cursorVisibleState) {
      const cx = cursor.col * this.charWidth;
      const cy = cursor.row * this.charHeight;

      // Authentic DOS underline / lower block cursor
      ctx.fillStyle = this.getColor(15);
      ctx.fillRect(cx, cy + this.charHeight - 3, this.charWidth, 3);
    }

    // Draw scanlines overlay if enabled
    if (this.crtScanlines) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      for (let y = 0; y < this.height; y += 2) {
        ctx.fillRect(0, y, this.width, 1);
      }
    }

    this.buffer.clearDirty();
  }

  /**
   * Draw character with special handling for box drawing and block characters
   * to guarantee seamless 0-gap lines.
   */
  private drawCellChar(char: string, x: number, y: number, fg: number): void {
    const ctx = this.ctx;
    const w = this.charWidth;
    const h = this.charHeight;
    const color = this.getColor(fg);

    // Pixel-perfect box drawing and block characters
    if (char === '█') {
      // Full block
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
      return;
    }
    if (char === '▀') {
      // Upper half block
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, Math.floor(h / 2));
      return;
    }
    if (char === '▄') {
      // Lower half block
      ctx.fillStyle = color;
      ctx.fillRect(x, y + Math.floor(h / 2), w, Math.ceil(h / 2));
      return;
    }
    if (char === '▌') {
      // Left half block
      ctx.fillStyle = color;
      ctx.fillRect(x, y, Math.floor(w / 2), h);
      return;
    }
    if (char === '▐') {
      // Right half block
      ctx.fillStyle = color;
      ctx.fillRect(x + Math.floor(w / 2), y, Math.ceil(w / 2), h);
      return;
    }
    if (char === '░') {
      // Light shade (25% stipple)
      ctx.fillStyle = color;
      for (let sy = 0; sy < h; sy += 2) {
        for (let sx = (sy % 4 === 0 ? 0 : 1); sx < w; sx += 2) {
          ctx.fillRect(x + sx, y + sy, 1, 1);
        }
      }
      return;
    }
    if (char === '▒') {
      // Medium shade (50% checkerboard)
      ctx.fillStyle = color;
      for (let sy = 0; sy < h; sy++) {
        for (let sx = (sy % 2 === 0 ? 0 : 1); sx < w; sx += 2) {
          ctx.fillRect(x + sx, y + sy, 1, 1);
        }
      }
      return;
    }
    if (char === '▓') {
      // Dark shade (75% stipple)
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
      const bgCell = this.buffer.getCell(Math.floor(y / h), Math.floor(x / w));
      ctx.fillStyle = this.getColor(bgCell ? bgCell.bg : 0);
      for (let sy = 0; sy < h; sy += 2) {
        for (let sx = (sy % 4 === 0 ? 0 : 1); sx < w; sx += 2) {
          ctx.fillRect(x + sx, y + sy, 1, 1);
        }
      }
      return;
    }

    // Common box lines: seamless drawing
    const midX = x + Math.floor(w / 2);
    const midY = y + Math.floor(h / 2);

    if (char === '─') {
      ctx.fillStyle = color;
      ctx.fillRect(x, midY, w, 1);
      return;
    }
    if (char === '│') {
      ctx.fillStyle = color;
      ctx.fillRect(midX, y, 1, h);
      return;
    }
    if (char === '═') {
      ctx.fillStyle = color;
      ctx.fillRect(x, midY - 1, w, 1);
      ctx.fillRect(x, midY + 1, w, 1);
      return;
    }
    if (char === '║') {
      ctx.fillStyle = color;
      ctx.fillRect(midX - 1, y, 1, h);
      ctx.fillRect(midX + 1, y, 1, h);
      return;
    }
    if (char === '┌') {
      ctx.fillStyle = color;
      ctx.fillRect(midX, midY, w - (midX - x), 1);
      ctx.fillRect(midX, midY, 1, h - (midY - y));
      return;
    }
    if (char === '┐') {
      ctx.fillStyle = color;
      ctx.fillRect(x, midY, midX - x + 1, 1);
      ctx.fillRect(midX, midY, 1, h - (midY - y));
      return;
    }
    if (char === '└') {
      ctx.fillStyle = color;
      ctx.fillRect(midX, midY, w - (midX - x), 1);
      ctx.fillRect(midX, y, 1, midY - y + 1);
      return;
    }
    if (char === '┘') {
      ctx.fillStyle = color;
      ctx.fillRect(x, midY, midX - x + 1, 1);
      ctx.fillRect(midX, y, 1, midY - y + 1);
      return;
    }
    if (char === '╔') {
      ctx.fillStyle = color;
      ctx.fillRect(midX - 1, midY - 1, w - (midX - x) + 1, 1);
      ctx.fillRect(midX + 1, midY + 1, w - (midX - x) - 1, 1);
      ctx.fillRect(midX - 1, midY - 1, 1, h - (midY - y) + 1);
      ctx.fillRect(midX + 1, midY + 1, 1, h - (midY - y) - 1);
      return;
    }
    if (char === '╗') {
      ctx.fillStyle = color;
      ctx.fillRect(x, midY - 1, midX - x + 2, 1);
      ctx.fillRect(x, midY + 1, midX - x, 1);
      ctx.fillRect(midX + 1, midY - 1, 1, h - (midY - y) + 1);
      ctx.fillRect(midX - 1, midY + 1, 1, h - (midY - y) - 1);
      return;
    }
    if (char === '╚') {
      ctx.fillStyle = color;
      ctx.fillRect(midX - 1, midY + 1, w - (midX - x) + 1, 1);
      ctx.fillRect(midX + 1, midY - 1, w - (midX - x) - 1, 1);
      ctx.fillRect(midX - 1, y, 1, midY - y + 2);
      ctx.fillRect(midX + 1, y, 1, midY - y);
      return;
    }
    if (char === '╝') {
      ctx.fillStyle = color;
      ctx.fillRect(x, midY + 1, midX - x + 2, 1);
      ctx.fillRect(x, midY - 1, midX - x, 1);
      ctx.fillRect(midX + 1, y, 1, midY - y + 2);
      ctx.fillRect(midX - 1, y, 1, midY - y);
      return;
    }

    // Default font glyph rendering
    ctx.fillStyle = color;
    ctx.font = '16px "Px437 IBM VGA 9x16", "Px437 IBM VGA 8x16", "Perfect DOS VGA 437", "Consolas", "Courier New", monospace';
    ctx.textBaseline = 'top';
    ctx.fillText(char, x, y);
  }

  private startRenderLoop(): void {
    const loop = (timestamp: number) => {
      // Toggle cursor blink every ~530ms
      if (timestamp - this.lastCursorBlink > 530) {
        this.cursorVisibleState = !this.cursorVisibleState;
        this.lastCursorBlink = timestamp;
        this.render();
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  public destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}

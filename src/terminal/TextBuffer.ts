import {
  TERMINAL_COLS,
  TERMINAL_ROWS,
  TerminalCell,
  CellAttribute,
  CursorPosition,
  VgaColorIndex,
} from './types';

export const DEFAULT_ATTRIBUTE: CellAttribute = {
  fg: 7, // Light Gray
  bg: 0, // Black
  bold: false,
  blink: false,
  reverse: false,
  underline: false,
};

export class TextBuffer {
  readonly cols: number;
  readonly rows: number;
  private grid: TerminalCell[][];
  private cursor: CursorPosition;
  private savedCursor: CursorPosition;
  private currentAttr: CellAttribute;
  private dirty = true;
  private changeListeners: Array<() => void> = [];

  constructor(cols: number = TERMINAL_COLS, rows: number = TERMINAL_ROWS) {
    this.cols = cols;
    this.rows = rows;
    this.cursor = { row: 0, col: 0, visible: true };
    this.savedCursor = { row: 0, col: 0, visible: true };
    this.currentAttr = { ...DEFAULT_ATTRIBUTE };
    this.grid = this.createEmptyGrid();
  }

  private createEmptyGrid(): TerminalCell[][] {
    const grid: TerminalCell[][] = [];
    for (let r = 0; r < this.rows; r++) {
      const row: TerminalCell[] = [];
      for (let c = 0; c < this.cols; c++) {
        row.push(this.createCell(' '));
      }
      grid.push(row);
    }
    return grid;
  }

  private createCell(char: string): TerminalCell {
    let fg = this.currentAttr.fg;
    let bg = this.currentAttr.bg;
    if (this.currentAttr.bold && fg < 8) {
      fg = (fg + 8) as VgaColorIndex;
    }
    if (this.currentAttr.reverse) {
      const tmp = fg;
      fg = bg;
      bg = tmp;
    }
    return {
      char,
      fg,
      bg,
      bold: this.currentAttr.bold,
      blink: this.currentAttr.blink,
      reverse: this.currentAttr.reverse,
      underline: this.currentAttr.underline,
    };
  }

  public addChangeListener(fn: () => void): void {
    this.changeListeners.push(fn);
  }

  public removeChangeListener(fn: () => void): void {
    const idx = this.changeListeners.indexOf(fn);
    if (idx !== -1) {
      this.changeListeners.splice(idx, 1);
    }
  }

  private markDirty(): void {
    this.dirty = true;
    for (const listener of this.changeListeners) {
      listener();
    }
  }

  public isDirty(): boolean {
    return this.dirty;
  }

  public clearDirty(): void {
    this.dirty = false;
  }

  public getCursor(): CursorPosition {
    return { ...this.cursor };
  }

  public setCursorVisibility(visible: boolean): void {
    if (this.cursor.visible !== visible) {
      this.cursor.visible = visible;
      this.markDirty();
    }
  }

  public setCursor(row: number, col: number): void {
    this.cursor.row = Math.max(0, Math.min(this.rows - 1, row));
    this.cursor.col = Math.max(0, Math.min(this.cols - 1, col));
    this.markDirty();
  }

  public moveCursor(dRow: number, dCol: number): void {
    this.setCursor(this.cursor.row + dRow, this.cursor.col + dCol);
  }

  public saveCursor(): void {
    this.savedCursor = { ...this.cursor };
  }

  public restoreCursor(): void {
    this.cursor = { ...this.savedCursor };
    this.markDirty();
  }

  public getAttributes(): CellAttribute {
    return { ...this.currentAttr };
  }

  public setAttributes(attr: Partial<CellAttribute>): void {
    this.currentAttr = { ...this.currentAttr, ...attr };
  }

  public resetAttributes(): void {
    this.currentAttr = { ...DEFAULT_ATTRIBUTE };
  }

  public getCell(row: number, col: number): TerminalCell | null {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return null;
    }
    return this.grid[row][col];
  }

  public setCell(row: number, col: number, char: string, attr?: Partial<CellAttribute>): void {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return;
    }
    const saved = { ...this.currentAttr };
    if (attr) {
      this.setAttributes(attr);
    }
    this.grid[row][col] = this.createCell(char);
    this.currentAttr = saved;
    this.markDirty();
  }

  public writeChar(char: string): void {
    if (char === '\r') {
      this.cursor.col = 0;
      this.markDirty();
      return;
    }

    if (char === '\n') {
      this.cursor.col = 0;
      this.cursor.row++;
      if (this.cursor.row >= this.rows) {
        this.scrollUp(1);
        this.cursor.row = this.rows - 1;
      }
      this.markDirty();
      return;
    }

    if (char === '\b' || char === '\x7f') {
      if (this.cursor.col > 0) {
        this.cursor.col--;
        this.grid[this.cursor.row][this.cursor.col] = this.createCell(' ');
        this.markDirty();
      }
      return;
    }

    if (char === '\t') {
      const nextTabStop = Math.min(this.cols - 1, (Math.floor(this.cursor.col / 8) + 1) * 8);
      while (this.cursor.col < nextTabStop) {
        this.writeChar(' ');
      }
      return;
    }

    // Normal character
    if (this.cursor.col >= this.cols) {
      this.cursor.col = 0;
      this.cursor.row++;
      if (this.cursor.row >= this.rows) {
        this.scrollUp(1);
        this.cursor.row = this.rows - 1;
      }
    }

    this.grid[this.cursor.row][this.cursor.col] = this.createCell(char);
    this.cursor.col++;
    if (this.cursor.col >= this.cols) {
      // Stay on last column until next char, or wrap on next char
      // Auto-wrap is triggered on the next character write
    }
    this.markDirty();
  }

  public write(text: string): void {
    for (let i = 0; i < text.length; i++) {
      this.writeChar(text[i]);
    }
  }

  public writeLine(text = ''): void {
    this.write(text + '\r\n');
  }

  public scrollUp(numLines = 1): void {
    for (let i = 0; i < numLines; i++) {
      this.grid.shift();
      const newRow: TerminalCell[] = [];
      for (let c = 0; c < this.cols; c++) {
        newRow.push(this.createCell(' '));
      }
      this.grid.push(newRow);
    }
    this.markDirty();
  }

  public clearScreen(homeCursor = true): void {
    this.grid = this.createEmptyGrid();
    if (homeCursor) {
      this.cursor.row = 0;
      this.cursor.col = 0;
    }
    this.markDirty();
  }

  public clearLine(row = this.cursor.row): void {
    if (row < 0 || row >= this.rows) return;
    for (let c = 0; c < this.cols; c++) {
      this.grid[row][c] = this.createCell(' ');
    }
    this.markDirty();
  }

  public clearToEndOfLine(): void {
    for (let c = this.cursor.col; c < this.cols; c++) {
      this.grid[this.cursor.row][c] = this.createCell(' ');
    }
    this.markDirty();
  }

  public clearToEndOfScreen(): void {
    this.clearToEndOfLine();
    for (let r = this.cursor.row + 1; r < this.rows; r++) {
      this.clearLine(r);
    }
    this.markDirty();
  }

  public getPlainText(): string {
    return this.grid
      .map(row => row.map(cell => cell.char).join('').trimEnd())
      .join('\n');
  }
}

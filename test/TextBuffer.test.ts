import { describe, it, expect } from 'vitest';
import { TextBuffer } from '../src/terminal/TextBuffer';

describe('TextBuffer', () => {
  it('initializes with 80 columns and 25 rows', () => {
    const buffer = new TextBuffer();
    expect(buffer.cols).toBe(80);
    expect(buffer.rows).toBe(25);
    const cursor = buffer.getCursor();
    expect(cursor.row).toBe(0);
    expect(cursor.col).toBe(0);
  });

  it('writes text and advances cursor', () => {
    const buffer = new TextBuffer();
    buffer.write('C:\\>');
    const cursor = buffer.getCursor();
    expect(cursor.row).toBe(0);
    expect(cursor.col).toBe(4);

    const cell0 = buffer.getCell(0, 0);
    expect(cell0?.char).toBe('C');
    const cell1 = buffer.getCell(0, 1);
    expect(cell1?.char).toBe(':');
    const cell2 = buffer.getCell(0, 2);
    expect(cell2?.char).toBe('\\');
    const cell3 = buffer.getCell(0, 3);
    expect(cell3?.char).toBe('>');
  });

  it('handles carriage return and line feed', () => {
    const buffer = new TextBuffer();
    buffer.write('Line 1\r\nLine 2');
    const cursor = buffer.getCursor();
    expect(cursor.row).toBe(1);
    expect(cursor.col).toBe(6);

    expect(buffer.getCell(0, 0)?.char).toBe('L');
    expect(buffer.getCell(1, 0)?.char).toBe('L');
  });

  it('handles backspace correctly', () => {
    const buffer = new TextBuffer();
    buffer.write('TEST');
    buffer.writeChar('\b');
    expect(buffer.getCursor().col).toBe(3);
    expect(buffer.getCell(0, 3)?.char).toBe(' ');
  });

  it('scrolls up when exceeding row count', () => {
    const buffer = new TextBuffer(80, 5); // 5 rows buffer
    for (let i = 0; i < 6; i++) {
      buffer.writeLine(`Row ${i}`);
    }
    // After 6 lines in a 5-line buffer, Rows 0 and 1 scrolled off
    // Top visible row is Row 2
    expect(buffer.getCell(0, 0)?.char).toBe('R');
    expect(buffer.getCell(0, 4)?.char).toBe('2');
  });

  it('clears screen', () => {
    const buffer = new TextBuffer();
    buffer.write('Some text');
    buffer.clearScreen(true);
    expect(buffer.getCursor().row).toBe(0);
    expect(buffer.getCursor().col).toBe(0);
    expect(buffer.getCell(0, 0)?.char).toBe(' ');
  });
});

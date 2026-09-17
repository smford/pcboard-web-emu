import { describe, it, expect, vi } from 'vitest';
import { TextBuffer } from '../src/terminal/TextBuffer';
import { AnsiParser } from '../src/terminal/AnsiParser';

describe('AnsiParser', () => {
  it('parses standard ANSI color sequences', () => {
    const buffer = new TextBuffer();
    const parser = new AnsiParser(buffer);

    // ESC [ 1 ; 32 m -> Bold Green (VGA 10)
    parser.parse('\x1b[1;32mGREEN TEXT\x1b[0m');

    const cell = buffer.getCell(0, 0);
    expect(cell?.char).toBe('G');
    expect(cell?.fg).toBe(10); // Bright green
  });

  it('parses PCBoard @X color codes', () => {
    const buffer = new TextBuffer();
    const parser = new AnsiParser(buffer, { enablePcboardCodes: true });

    // @X0E -> Bg 0 (Black), Fg E (14: Yellow)
    parser.parse('@X0EYELLOW@X07');

    const cell = buffer.getCell(0, 0);
    expect(cell?.char).toBe('Y');
    expect(cell?.bg).toBe(0);
    expect(cell?.fg).toBe(14); // Yellow

    // Last char 'W' is at index 5
    const cellW = buffer.getCell(0, 5);
    expect(cellW?.char).toBe('W');
  });

  it('triggers bell callback on \\x07', () => {
    const buffer = new TextBuffer();
    const bellSpy = vi.fn();
    const parser = new AnsiParser(buffer, { onBell: bellSpy });

    parser.parse('ALERT\x07');
    expect(bellSpy).toHaveBeenCalledTimes(1);
  });

  it('moves cursor with ANSI cursor codes', () => {
    const buffer = new TextBuffer();
    const parser = new AnsiParser(buffer);

    // Position at row 5, col 10 (1-indexed 6;11)
    parser.parse('\x1b[6;11HTEST');
    expect(buffer.getCursor().row).toBe(5);
    expect(buffer.getCursor().col).toBe(14);
    expect(buffer.getCell(5, 10)?.char).toBe('T');
  });

  it('clears screen with ESC[2J', () => {
    const buffer = new TextBuffer();
    const parser = new AnsiParser(buffer);

    parser.parse('HELLO\x1b[2JWORLD');
    expect(buffer.getCell(0, 0)?.char).toBe('W');
  });
});

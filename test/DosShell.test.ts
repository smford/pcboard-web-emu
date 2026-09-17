import { describe, it, expect, vi } from 'vitest';
import { TextBuffer } from '../src/terminal/TextBuffer';
import { AnsiParser } from '../src/terminal/AnsiParser';
import { DosShell } from '../src/dos/DosShell';
import { SoundSystem } from '../src/audio/SoundSystem';

describe('DosShell', () => {
  it('initializes and prints MS-DOS prompt', () => {
    const buffer = new TextBuffer();
    const parser = new AnsiParser(buffer);
    const sound = new SoundSystem();
    const dos = new DosShell(buffer, parser, sound);

    dos.initPrompt();
    const plain = buffer.getPlainText();
    expect(plain).toContain('MS-DOS 6.22 Startup Complete');
    expect(plain).toContain('C:\\>');
  });

  it('handles VER command', () => {
    const buffer = new TextBuffer();
    const parser = new AnsiParser(buffer);
    const sound = new SoundSystem();
    const dos = new DosShell(buffer, parser, sound);

    dos.initPrompt();
    'VER'.split('').forEach(ch => dos.handleKey(ch));
    dos.handleKey('Enter');

    const plain = buffer.getPlainText();
    expect(plain).toContain('MS-DOS Version 6.22');
  });

  it('handles DIR command listing files', () => {
    const buffer = new TextBuffer();
    const parser = new AnsiParser(buffer);
    const sound = new SoundSystem();
    const dos = new DosShell(buffer, parser, sound);

    dos.initPrompt();
    'DIR'.split('').forEach(ch => dos.handleKey(ch));
    dos.handleKey('Enter');

    const plain = buffer.getPlainText();
    expect(plain).toContain('COMMAND  COM');
    expect(plain).toContain('CONFIG   SYS');
    expect(plain).toContain('AUTOEXEC BAT');
    expect(plain).toContain('bytes free');
  });

  it('triggers connect callback when PCBOARD command is entered', () => {
    const buffer = new TextBuffer();
    const parser = new AnsiParser(buffer);
    const sound = new SoundSystem();
    const dos = new DosShell(buffer, parser, sound);

    const connectSpy = vi.fn();
    dos.setOnConnectBbs(connectSpy);

    dos.initPrompt();
    'PCBOARD'.split('').forEach(ch => dos.handleKey(ch));
    dos.handleKey('Enter');

    expect(connectSpy).toHaveBeenCalledTimes(1);
  });
});

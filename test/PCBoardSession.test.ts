import { describe, it, expect } from 'vitest';
import { TextBuffer } from '../src/terminal/TextBuffer';
import { AnsiParser } from '../src/terminal/AnsiParser';
import { SoundSystem } from '../src/audio/SoundSystem';
import { PCBoardSession } from '../src/bbs/PCBoardSession';

describe('PCBoardSession', () => {
  it('starts in IDLE state', () => {
    const buffer = new TextBuffer();
    const parser = new AnsiParser(buffer);
    const sound = new SoundSystem();
    const session = new PCBoardSession(buffer, parser, sound);

    expect(session.getState()).toBe('IDLE');
  });

  it('runs login sequence for SysOp and grants high security level', async () => {
    const buffer = new TextBuffer();
    const parser = new AnsiParser(buffer);
    const sound = new SoundSystem();
    sound.setMuted(true); // mute for test
    const session = new PCBoardSession(buffer, parser, sound);

    await session.connect();
    expect(session.getState()).toBe('PROMPT_GRAPHICS');

    // Confirm graphics
    session.handleKey('Y');
    session.handleKey('Enter');
    expect(session.getState()).toBe('PROMPT_FIRST_NAME');

    // First Name: Fred
    'Fred'.split('').forEach(ch => session.handleKey(ch));
    session.handleKey('Enter');
    expect(session.getState()).toBe('PROMPT_LAST_NAME');

    // Last Name: Clark (SysOp)
    'Clark'.split('').forEach(ch => session.handleKey(ch));
    session.handleKey('Enter');
    expect(session.getState()).toBe('PROMPT_PASSWORD');
    expect(session.getUser().securityLevel).toBe(110);

    // Password
    'secret'.split('').forEach(ch => session.handleKey(ch));
    session.handleKey('Enter');
    expect(session.getState()).toBe('PAUSE_MOTD');

    // Advance through MOTD and Mail pause
    session.handleKey('Enter');
    expect(session.getState()).toBe('PAUSE_MAIL');
    session.handleKey('Enter');
    expect(session.getState()).toBe('MAIN_MENU');
  });

  it('navigates main menu commands', () => {
    const buffer = new TextBuffer();
    const parser = new AnsiParser(buffer);
    const sound = new SoundSystem();
    const session = new PCBoardSession(buffer, parser, sound);

    session.displayMainMenu();
    expect(session.getState()).toBe('MAIN_MENU');

    // Go to Bulletins
    session.handleKey('B');
    session.handleKey('Enter');
    expect(session.getState()).toBe('BULLETINS');

    // Return to main menu
    session.handleKey('0');
    session.handleKey('Enter');
    expect(session.getState()).toBe('MAIN_MENU');

    // Go to Who is online
    session.handleKey('W');
    session.handleKey('Enter');
    expect(session.getState()).toBe('WHO_ONLINE');

    // Return to main menu
    session.handleKey('Enter');
    expect(session.getState()).toBe('MAIN_MENU');
  });
});

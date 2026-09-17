import { TextBuffer } from '../terminal/TextBuffer';
import { AnsiParser } from '../terminal/AnsiParser';
import { SoundSystem } from '../audio/SoundSystem';

export interface FileEntry {
  name: string;
  isDir: boolean;
  size: number;
  date: string;
  content?: string;
}

export class DosShell {
  private buffer: TextBuffer;
  private parser: AnsiParser;
  private sound: SoundSystem;
  private currentPath = 'C:\\';
  private currentInput = '';
  private isTelixMode = false;
  private onConnectBbs?: (phone?: string) => void;

  private files: Record<string, FileEntry[]> = {
    'C:\\': [
      { name: 'DOS', isDir: true, size: 0, date: '05-31-1994 06:22a' },
      { name: 'COMM', isDir: true, size: 0, date: '06-15-1994 02:14p' },
      { name: 'PCBOARD', isDir: true, size: 0, date: '10-12-1994 11:30a' },
      {
        name: 'COMMAND.COM',
        isDir: false,
        size: 54645,
        date: '05-31-1994 06:22a',
        content: 'MS-DOS Command Processor',
      },
      {
        name: 'CONFIG.SYS',
        isDir: false,
        size: 214,
        date: '06-01-1994 08:00a',
        content: 'DEVICE=C:\\DOS\\HIMEM.SYS\r\nDEVICE=C:\\DOS\\EMM386.EXE NOEMS\r\nDOS=HIGH,UMB\r\nFILES=50\r\nBUFFERS=30\r\nLASTDRIVE=Z\r\n',
      },
      {
        name: 'AUTOEXEC.BAT',
        isDir: false,
        size: 198,
        date: '06-01-1994 08:00a',
        content: '@ECHO OFF\r\nPROMPT $P$G\r\nPATH C:\\DOS;C:\\COMM;C:\\PCBOARD\r\nSET TEMP=C:\\TEMP\r\nMODE CON: RATE=32 DELAY=1\r\nECHO MS-DOS 6.22 Startup Complete.\r\n',
      },
    ],
    'C:\\COMM': [
      {
        name: 'TELIX.EXE',
        isDir: false,
        size: 274800,
        date: '03-15-1994 01:20p',
        content: 'Telix Telecommunications Software v3.22',
      },
      {
        name: 'TELIX.FON',
        isDir: false,
        size: 12400,
        date: '03-15-1994 01:20p',
        content: 'Telix Phone Directory Database',
      },
      {
        name: 'MODEM.CFG',
        isDir: false,
        size: 840,
        date: '03-15-1994 01:20p',
        content: 'COM1: 28800,8,N,1 RTS/CTS',
      },
    ],
    'C:\\PCBOARD': [
      {
        name: 'PCBOARD.EXE',
        isDir: false,
        size: 420800,
        date: '10-14-1994 10:00a',
        content: 'PCBoard v15.22/i386 BBS Core Executable',
      },
      {
        name: 'PCB.BAT',
        isDir: false,
        size: 145,
        date: '10-14-1994 10:00a',
        content: '@ECHO OFF\r\nC:\\PCBOARD\\PCBOARD.EXE /N:1\r\n',
      },
    ],
    'C:\\DOS': [
      { name: 'MEM.EXE', isDir: false, size: 32150, date: '05-31-1994 06:22a' },
      { name: 'CHKDSK.EXE', isDir: false, size: 12908, date: '05-31-1994 06:22a' },
      { name: 'EDIT.COM', isDir: false, size: 413, date: '05-31-1994 06:22a' },
      { name: 'FORMAT.COM', isDir: false, size: 22774, date: '05-31-1994 06:22a' },
    ],
  };

  constructor(buffer: TextBuffer, parser: AnsiParser, sound: SoundSystem) {
    this.buffer = buffer;
    this.parser = parser;
    this.sound = sound;
  }

  public setOnConnectBbs(cb: (phone?: string) => void): void {
    this.onConnectBbs = cb;
  }

  public initPrompt(): void {
    this.buffer.clearScreen(true);
    this.parser.parse('Starting MS-DOS 6.22...\r\n\r\n');
    this.parser.parse('HIMEM is testing extended memory...done.\r\n');
    this.parser.parse('MS-DOS 6.22 Startup Complete.\r\n\r\n');
    this.parser.parse('\x1b[0;37mType \x1b[1;33mPCBOARD\x1b[0;37m to dial BBS, \x1b[1;33mTELIX\x1b[0;37m for modem terminal, or \x1b[1;33mHELP\x1b[0;37m for DOS commands.\x1b[0m\r\n\r\n');
    this.showPrompt();
  }

  public showPrompt(): void {
    if (this.isTelixMode) {
      this.parser.parse('\r\n\x1b[1;36mTELIX [Online - Modem COM1 28800 8-N-1] (Type ATDT 555-1994 or EXIT):\x1b[0m\r\n');
    } else {
      this.parser.parse(`\x1b[0;37m${this.currentPath}>\x1b[0m`);
    }
    this.currentInput = '';
  }

  public handleKey(key: string): void {
    this.sound.playKeyClick();

    if (key === 'Enter') {
      const line = this.currentInput.trim();
      this.buffer.writeLine();
      this.executeCommand(line);
      this.currentInput = '';
      return;
    }

    if (key === 'Backspace') {
      if (this.currentInput.length > 0) {
        this.currentInput = this.currentInput.slice(0, -1);
        this.buffer.write('\b \b');
      }
      return;
    }

    if (key.length === 1) {
      this.currentInput += key;
      this.buffer.write(key);
    }
  }

  private executeCommand(cmdLine: string): void {
    if (!cmdLine) {
      this.showPrompt();
      return;
    }

    if (this.isTelixMode) {
      this.handleTelixCommand(cmdLine);
      return;
    }

    const parts = cmdLine.split(/\s+/);
    const cmd = parts[0].toUpperCase();
    const arg = parts.slice(1).join(' ');

    switch (cmd) {
      case 'DIR':
        this.cmdDir();
        break;
      case 'CD':
      case 'CHDIR':
        this.cmdCd(arg);
        break;
      case 'TYPE':
        this.cmdType(arg);
        break;
      case 'VER':
        this.parser.parse('\r\nMS-DOS Version 6.22\r\n\r\n');
        this.showPrompt();
        break;
      case 'MEM':
        this.cmdMem();
        break;
      case 'CLS':
        this.buffer.clearScreen(true);
        this.showPrompt();
        break;
      case 'HELP':
        this.cmdHelp();
        break;
      case 'DATE':
        this.parser.parse(`\r\nCurrent date is ${new Date().toLocaleDateString('en-US')}\r\n\r\n`);
        this.showPrompt();
        break;
      case 'TIME':
        this.parser.parse(`\r\nCurrent time is ${new Date().toLocaleTimeString('en-US')}\r\n\r\n`);
        this.showPrompt();
        break;
      case 'BEEP':
        this.sound.playPcSpeaker(800, 150);
        this.showPrompt();
        break;
      case 'ECHO':
        this.parser.parse(`${arg}\r\n\r\n`);
        this.showPrompt();
        break;
      case 'TELIX':
      case 'COMM':
        this.isTelixMode = true;
        this.buffer.clearScreen(true);
        this.parser.parse('\x1b[1;36mTELIX v3.22 (C) 1986-1994 deltaComm Development, Inc.\x1b[0m\r\n');
        this.parser.parse('Initializing Hayes-compatible USRobotics Courier V.34 on COM1...\r\n');
        this.parser.parse('ATZ\r\nOK\r\n');
        this.showPrompt();
        break;
      case 'PCBOARD':
      case 'PCB':
      case 'BBS':
        this.launchBbs();
        break;
      default:
        this.sound.playPcSpeaker(300, 80);
        this.parser.parse(`Bad command or file name\r\n\r\n`);
        this.showPrompt();
        break;
    }
  }

  private handleTelixCommand(cmdLine: string): void {
    const upper = cmdLine.toUpperCase();

    if (upper === 'EXIT' || upper === 'QUIT') {
      this.isTelixMode = false;
      this.buffer.clearScreen(true);
      this.parser.parse('Exiting Telix terminal...\r\n\r\n');
      this.showPrompt();
      return;
    }

    if (upper === 'AT') {
      this.parser.parse('OK\r\n');
      this.showPrompt();
      return;
    }

    if (upper.startsWith('ATZ')) {
      this.parser.parse('OK\r\n');
      this.showPrompt();
      return;
    }

    if (upper.startsWith('ATI')) {
      this.parser.parse('USRobotics Courier V.34 Dual Standard 28,800 Fax/Modem\r\nOK\r\n');
      this.showPrompt();
      return;
    }

    if (upper.startsWith('ATH')) {
      this.parser.parse('NO CARRIER\r\nOK\r\n');
      this.showPrompt();
      return;
    }

    if (upper.startsWith('ATDT') || upper.startsWith('ATDP')) {
      const phone = cmdLine.slice(4).trim() || '555-1994';
      this.isTelixMode = false;
      if (this.onConnectBbs) {
        this.onConnectBbs(phone);
      }
      return;
    }

    this.parser.parse('ERROR\r\n');
    this.showPrompt();
  }

  private launchBbs(): void {
    if (this.onConnectBbs) {
      this.onConnectBbs('555-1994');
    }
  }

  private cmdDir(): void {
    const list = this.files[this.currentPath] || [];
    this.parser.parse(`\r\n Volume in drive C is MS-DOS_622\r\n`);
    this.parser.parse(` Volume Serial Number is 1E24-7C91\r\n`);
    this.parser.parse(` Directory of ${this.currentPath}\r\n\r\n`);

    if (this.currentPath !== 'C:\\') {
      this.parser.parse(`.            <DIR>         05-31-94   6:22a\r\n`);
      this.parser.parse(`..           <DIR>         05-31-94   6:22a\r\n`);
    }

    let fileCount = 0;
    let dirCount = this.currentPath !== 'C:\\' ? 2 : 0;
    let totalBytes = 0;

    list.forEach(item => {
      const nameParts = item.name.split('.');
      const base = nameParts[0].padEnd(8);
      const ext = (nameParts[1] || '').padEnd(3);

      if (item.isDir) {
        dirCount++;
        this.parser.parse(`${base} ${ext}   <DIR>         ${item.date}\r\n`);
      } else {
        fileCount++;
        totalBytes += item.size;
        const sizeStr = item.size.toLocaleString('en-US').padStart(10);
        this.parser.parse(`${base} ${ext}  ${sizeStr}   ${item.date}\r\n`);
      }
    });

    this.parser.parse(`        ${fileCount} file(s)     ${totalBytes.toLocaleString('en-US')} bytes\r\n`);
    this.parser.parse(`        ${dirCount} dir(s)    234,881,024 bytes free\r\n\r\n`);
    this.showPrompt();
  }

  private cmdCd(dir: string): void {
    const target = dir.toUpperCase().trim();
    if (!target || target === '.') {
      this.parser.parse(`\r\n${this.currentPath}\r\n\r\n`);
      this.showPrompt();
      return;
    }

    if (target === '..') {
      this.currentPath = 'C:\\';
      this.parser.parse('\r\n');
      this.showPrompt();
      return;
    }

    if (target === '\\') {
      this.currentPath = 'C:\\';
      this.parser.parse('\r\n');
      this.showPrompt();
      return;
    }

    const possiblePath = this.currentPath === 'C:\\' ? `C:\\${target}` : `C:\\${target}`;
    if (this.files[possiblePath]) {
      this.currentPath = possiblePath;
      this.parser.parse('\r\n');
    } else {
      this.sound.playPcSpeaker(300, 80);
      this.parser.parse(`\r\nInvalid directory\r\n\r\n`);
    }
    this.showPrompt();
  }

  private cmdType(filename: string): void {
    const target = filename.toUpperCase().trim();
    if (!target) {
      this.parser.parse('\r\nRequired parameter missing\r\n\r\n');
      this.showPrompt();
      return;
    }

    const list = this.files[this.currentPath] || [];
    const found = list.find(f => f.name.toUpperCase() === target);

    if (found && found.content) {
      this.parser.parse(`\r\n${found.content}\r\n`);
    } else {
      this.sound.playPcSpeaker(300, 80);
      this.parser.parse(`\r\nFile not found\r\n\r\n`);
    }
    this.showPrompt();
  }

  private cmdMem(): void {
    this.parser.parse(
      `\r\nMemory Type        Total    =     Used    +     Free\r\n` +
      `----------------  -------        -------        -------\r\n` +
      `Conventional         640K            58K           582K\r\n` +
      `Upper                  0K             0K             0K\r\n` +
      `Reserved             384K           384K             0K\r\n` +
      `Extended (XMS)    15,360K         2,048K        13,312K\r\n` +
      `----------------  -------        -------        -------\r\n` +
      `Total memory      16,384K         2,490K        13,894K\r\n\r\n` +
      `Total under 1 MB     640K            58K           582K\r\n\r\n` +
      `Largest executable program size       582K (595,968 bytes)\r\n` +
      `Largest free upper memory block         0K       (0 bytes)\r\n` +
      `MS-DOS is resident in the high memory area.\r\n\r\n`
    );
    this.showPrompt();
  }

  private cmdHelp(): void {
    this.parser.parse(
      `\r\n\x1b[1;36mAvailable MS-DOS Commands:\x1b[0m\r\n` +
      `  \x1b[1;33mPCBOARD\x1b[0m   - Launch and dial the PCBoard BBS system\r\n` +
      `  \x1b[1;33mTELIX\x1b[0m     - Open modem terminal (supports ATDT phone dialing)\r\n` +
      `  \x1b[1;33mDIR\x1b[0m       - List directory files\r\n` +
      `  \x1b[1;33mCD\x1b[0m        - Change current directory (e.g. CD COMM, CD ..)\r\n` +
      `  \x1b[1;33mTYPE\x1b[0m      - View file contents (e.g. TYPE CONFIG.SYS)\r\n` +
      `  \x1b[1;33mMEM\x1b[0m       - Display memory usage stats\r\n` +
      `  \x1b[1;33mVER\x1b[0m       - Display MS-DOS version\r\n` +
      `  \x1b[1;33mDATE\x1b[0m      - Display system date\r\n` +
      `  \x1b[1;33mTIME\x1b[0m      - Display system time\r\n` +
      `  \x1b[1;33mBEEP\x1b[0m      - Sound PC speaker beep\r\n` +
      `  \x1b[1;33mCLS\x1b[0m       - Clear screen\r\n\r\n`
    );
    this.showPrompt();
  }
}

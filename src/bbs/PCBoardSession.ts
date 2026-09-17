import { TextBuffer } from '../terminal/TextBuffer';
import { AnsiParser } from '../terminal/AnsiParser';
import { SoundSystem } from '../audio/SoundSystem';
import {
  BBS_WELCOME_SCREEN,
  BBS_MOTD,
  MAIN_MENU,
  BULLETINS_LIST,
  WHO_IS_ONLINE,
  FILE_DIRECTORY,
  DOOR_LORD_INTRO,
  DOOR_TW2002_INTRO,
  GOODBYE_SCREEN,
} from './ansiArt';

export type BBSState =
  | 'IDLE'
  | 'DIALING'
  | 'PROMPT_GRAPHICS'
  | 'PROMPT_FIRST_NAME'
  | 'PROMPT_LAST_NAME'
  | 'PROMPT_PASSWORD'
  | 'PROMPT_NEW_CITY'
  | 'PROMPT_NEW_PHONE'
  | 'PROMPT_NEW_PW'
  | 'PROMPT_NEW_PW_CONFIRM'
  | 'PAUSE_MOTD'
  | 'PAUSE_MAIL'
  | 'MAIN_MENU'
  | 'BULLETINS'
  | 'WHO_ONLINE'
  | 'FILES'
  | 'DOWNLOADING'
  | 'MESSAGES_LIST'
  | 'MESSAGE_READ'
  | 'MSG_ENTER_TO'
  | 'MSG_ENTER_SUBJ'
  | 'MSG_ENTER_BODY'
  | 'DOORS'
  | 'DOOR_LORD'
  | 'DOOR_TW2002'
  | 'SYSOP_CHAT'
  | 'USER_STATS'
  | 'GOODBYE';

export interface BbsUser {
  firstName: string;
  lastName: string;
  city: string;
  phone: string;
  securityLevel: number;
  timeRemaining: number;
  filesDownloaded: number;
  filesUploaded: number;
  callsCount: number;
}

export interface BbsMessage {
  id: number;
  from: string;
  to: string;
  date: string;
  subject: string;
  body: string[];
}

const DEFAULT_MESSAGES: BbsMessage[] = [
  {
    id: 1,
    from: 'Fred Clark (SysOp)',
    to: 'All',
    date: '10-14-1994',
    subject: 'Welcome to Metropolis PCBoard v15.22',
    body: [
      'Welcome to the Metropolis PCBoard BBS system!',
      'We are running PCBoard v15.22/i386 on a 486DX4-100 with USRobotics',
      'Courier V.34 Dual Standard 28.8k modems.',
      'Check out the File directories and Door games!',
    ],
  },
  {
    id: 2,
    from: 'Smford (Co-SysOp / SRE)',
    to: 'All',
    date: '10-18-1994',
    subject: 'SRE Reliability & Infrastructure Report',
    body: [
      'Site Reliability update:',
      '- Node 1-4 MTBF target: 99.999% uptime',
      '- Battery backup APC Smart-UPS 2000 online',
      '- Automated nightly differential tape backup at 04:00 AM',
      '- High-speed caching enabled for CD-ROM file libraries.',
    ],
  },
  {
    id: 3,
    from: 'Acid Burn',
    to: 'Crash Override',
    date: '10-20-1994',
    subject: 'Did you check the new ANSI packs?',
    body: [
      'Check out THEDRAW.ZIP and the latest ACiD & iCE ANSI collections',
      'in Conference 0 files section. Incredible art!',
    ],
  },
];

export class PCBoardSession {
  private buffer: TextBuffer;
  private parser: AnsiParser;
  private sound: SoundSystem;
  private state: BBSState = 'IDLE';

  private user: BbsUser = {
    firstName: 'Guest',
    lastName: 'Caller',
    city: 'CyberSpace',
    phone: '555-0100',
    securityLevel: 20,
    timeRemaining: 60,
    filesDownloaded: 0,
    filesUploaded: 0,
    callsCount: 1,
  };

  private currentInput = '';
  private isNewUser = false;
  private tempFirstName = '';
  private tempLastName = '';
  private tempCity = '';
  private tempPhone = '';
  private tempPassword = '';
  private currentMsgDraft: { to: string; subject: string; body: string[] } = { to: '', subject: '', body: [] };
  private messages: BbsMessage[] = [...DEFAULT_MESSAGES];
  private selectedMsgIdx = 0;
  private expertMode = false;
  private sessionStartTime = Date.now();

  // Callbacks
  private onDisconnectCallback?: () => void;
  private onStateChangeCallback?: (state: BBSState) => void;

  constructor(buffer: TextBuffer, parser: AnsiParser, sound: SoundSystem) {
    this.buffer = buffer;
    this.parser = parser;
    this.sound = sound;
    this.loadMessages();
  }

  public getState(): BBSState {
    return this.state;
  }

  public getUser(): BbsUser {
    return this.user;
  }

  public setOnDisconnect(cb: () => void): void {
    this.onDisconnectCallback = cb;
  }

  public setOnStateChange(cb: (state: BBSState) => void): void {
    this.onStateChangeCallback = cb;
  }

  private setState(newState: BBSState): void {
    this.state = newState;
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(newState);
    }
  }

  private loadMessages(): void {
    try {
      const saved = localStorage.getItem('pcboard_messages');
      if (saved) {
        this.messages = JSON.parse(saved);
      }
    } catch {}
  }

  private saveMessages(): void {
    try {
      localStorage.setItem('pcboard_messages', JSON.stringify(this.messages));
    } catch {}
  }

  /**
   * Start BBS connect sequence
   */
  public async connect(): Promise<void> {
    this.sessionStartTime = Date.now();
    this.setState('DIALING');
    this.buffer.clearScreen(true);
    this.parser.parse('\x1b[1;36mATDT 555-1994\x1b[0m\r\n');
    this.parser.parse('DIALING...\r\n');

    await this.sound.playModemHandshake('555-1994', (msg) => {
      this.parser.parse(`\x1b[0;37m${msg}\x1b[0m\r\n`);
    });

    this.sound.playPcSpeaker(1000, 100);
    this.parser.parse('\r\n\x1b[1;32mCONNECT 28800/ARQ/V42BIS/LAPM\x1b[0m\r\n\r\n');
    await this.delay(400);

    // Prompt graphics
    this.setState('PROMPT_GRAPHICS');
    this.parser.parse('\x1b[1;37mDo you want graphics (ANSI) [Y,n]? \x1b[0m');
    this.currentInput = '';
  }

  public handleKey(key: string, e?: KeyboardEvent): void {
    if (this.state === 'IDLE' || this.state === 'DIALING') return;

    this.sound.playKeyClick();

    if (key === 'Enter') {
      const input = this.currentInput.trim();
      this.buffer.writeLine();
      this.processInput(input);
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

    // Ctrl+C or Escape to break / return to main menu
    if (key === 'Escape' || (e && e.ctrlKey && key.toLowerCase() === 'c')) {
      if (['BULLETINS', 'WHO_ONLINE', 'FILES', 'MESSAGES_LIST', 'DOORS', 'SYSOP_CHAT', 'USER_STATS'].includes(this.state)) {
        this.displayMainMenu();
        return;
      }
    }

    if (key.length === 1) {
      this.currentInput += key;
      if (this.state === 'PROMPT_PASSWORD' || this.state === 'PROMPT_NEW_PW' || this.state === 'PROMPT_NEW_PW_CONFIRM') {
        this.buffer.write('*');
      } else {
        this.buffer.write(key);
      }
    }
  }

  private processInput(input: string): void {
    switch (this.state) {
      case 'PROMPT_GRAPHICS':
        this.parser.parse('\r\n\x1b[1;32mANSI graphics mode enabled.\x1b[0m\r\n\r\n');
        this.parser.parse(BBS_WELCOME_SCREEN);
        this.parser.parse('\r\n\x1b[1;37mWhat is your FIRST name? \x1b[0m');
        this.setState('PROMPT_FIRST_NAME');
        break;

      case 'PROMPT_FIRST_NAME':
        if (!input) {
          this.parser.parse('\x1b[1;37mWhat is your FIRST name? \x1b[0m');
          return;
        }
        this.tempFirstName = input;
        this.parser.parse('\x1b[1;37mWhat is your LAST name? \x1b[0m');
        this.setState('PROMPT_LAST_NAME');
        break;

      case 'PROMPT_LAST_NAME':
        if (!input) {
          this.parser.parse('\x1b[1;37mWhat is your LAST name? \x1b[0m');
          return;
        }
        this.tempLastName = input;
        this.checkUserAccount(this.tempFirstName, this.tempLastName);
        break;

      case 'PROMPT_PASSWORD':
        this.loginUser(input);
        break;

      case 'PROMPT_NEW_CITY':
        this.tempCity = input || 'Everywhere';
        this.parser.parse('\r\n\x1b[1;37mWhat is your voice telephone number? \x1b[0m');
        this.setState('PROMPT_NEW_PHONE');
        break;

      case 'PROMPT_NEW_PHONE':
        this.tempPhone = input || '555-1212';
        this.parser.parse('\r\n\x1b[1;37mChoose a password (4-12 characters): \x1b[0m');
        this.setState('PROMPT_NEW_PW');
        break;

      case 'PROMPT_NEW_PW':
        this.tempPassword = input || 'secret';
        this.parser.parse('\r\n\x1b[1;37mVerify password: \x1b[0m');
        this.setState('PROMPT_NEW_PW_CONFIRM');
        break;

      case 'PROMPT_NEW_PW_CONFIRM':
        if (this.tempPassword && input && input !== this.tempPassword) {
          this.parser.parse('\r\n\x1b[1;31mPasswords do not match. Using primary password.\x1b[0m\r\n');
        }
        this.completeNewUserRegistration();
        break;

      case 'PAUSE_MOTD':
        this.parser.parse('\r\n\x1b[1;36mChecking personal mail for ' + this.user.firstName + ' ' + this.user.lastName + '...\x1b[0m\r\n');
        this.parser.parse('\x1b[0;37mNo unread personal messages.\x1b[0m\r\n\r\n');
        this.parser.parse('\x1b[1;33m(Press ENTER for Main Menu)\x1b[0m ');
        this.setState('PAUSE_MAIL');
        break;

      case 'PAUSE_MAIL':
        this.displayMainMenu();
        break;

      case 'MAIN_MENU':
        this.handleMainMenuCommand(input.toUpperCase());
        break;

      case 'BULLETINS':
        this.handleBulletinChoice(input);
        break;

      case 'WHO_ONLINE':
      case 'USER_STATS':
        this.displayMainMenu();
        break;

      case 'FILES':
        this.handleFilesChoice(input.toUpperCase());
        break;

      case 'DOWNLOADING':
        this.displayMainMenu();
        break;

      case 'MESSAGES_LIST':
        this.handleMessagesChoice(input.toUpperCase());
        break;

      case 'MESSAGE_READ':
        if (input.toUpperCase() === 'R') {
          this.displayMessagesList();
        } else if (input.toUpperCase() === 'N') {
          this.selectedMsgIdx = (this.selectedMsgIdx + 1) % this.messages.length;
          this.viewCurrentMessage();
        } else {
          this.displayMainMenu();
        }
        break;

      case 'MSG_ENTER_TO':
        this.currentMsgDraft.to = input || 'All';
        this.parser.parse('\x1b[1;37mSubject: \x1b[0m');
        this.setState('MSG_ENTER_SUBJ');
        break;

      case 'MSG_ENTER_SUBJ':
        this.currentMsgDraft.subject = input || 'Retro Greeting';
        this.currentMsgDraft.body = [];
        this.parser.parse('\r\n\x1b[1;36mEnter message text. Enter a blank line or "." on a line to save.\x1b[0m\r\n');
        this.parser.parse('\x1b[1;30m: \x1b[0m');
        this.setState('MSG_ENTER_BODY');
        break;

      case 'MSG_ENTER_BODY':
        if (input === '.' || input === '') {
          this.finishEnteringMessage();
        } else {
          this.currentMsgDraft.body.push(input);
          this.parser.parse('\x1b[1;30m: \x1b[0m');
        }
        break;

      case 'DOORS':
        this.handleDoorsChoice(input.toUpperCase());
        break;

      case 'DOOR_LORD':
        this.handleLordAction(input.toUpperCase());
        break;

      case 'DOOR_TW2002':
        this.handleTwAction(input.toUpperCase());
        break;

      case 'SYSOP_CHAT':
        this.handleSysopChat(input);
        break;

      case 'GOODBYE':
        this.disconnect();
        break;
    }
  }

  private checkUserAccount(firstName: string, lastName: string): void {
    const fnLower = firstName.toLowerCase();
    const lnLower = lastName.toLowerCase();

    // Check if sysop
    if ((fnLower === 'sysop' || fnLower === 'fred' || fnLower === 'smford') && (lnLower === 'sysop' || lnLower === 'clark' || lnLower === 'ford' || lnLower === 'admin')) {
      this.user.firstName = firstName;
      this.user.lastName = lastName;
      this.user.securityLevel = 110;
      this.parser.parse(`\r\n\x1b[1;35mSysOp Account Recognized.\x1b[0m\r\n`);
      this.parser.parse(`\x1b[1;37mEnter SysOp Password: \x1b[0m`);
      this.setState('PROMPT_PASSWORD');
      return;
    }

    // Returning demo user or guest
    this.parser.parse(`\r\n\x1b[1;36mSearching user file for ${firstName} ${lastName}...\x1b[0m\r\n`);

    const knownUsers = ['john doe', 'jane doe', 'guest caller', 'sysop sysop'];
    const fullName = `${fnLower} ${lnLower}`;

    if (knownUsers.includes(fullName)) {
      this.user.firstName = firstName;
      this.user.lastName = lastName;
      this.parser.parse(`\x1b[1;37mEnter password: \x1b[0m`);
      this.setState('PROMPT_PASSWORD');
    } else {
      // New user registration
      this.isNewUser = true;
      this.user.firstName = firstName;
      this.user.lastName = lastName;
      this.parser.parse(`\x1b[1;33mUser not found in user file.\x1b[0m\r\n`);
      this.parser.parse(`\x1b[1;32mWould you like to register as a new caller? [Y,n]: \x1b[0m`);
      this.parser.parse(`\r\n\x1b[1;37mWhat is your City and State? \x1b[0m`);
      this.setState('PROMPT_NEW_CITY');
    }
  }

  private loginUser(_password: string): void {
    this.sound.playPcSpeaker(880, 80);
    this.parser.parse('\r\n\x1b[1;32mPassword accepted. Logging on...\x1b[0m\r\n\r\n');
    this.showSystemStats();
    this.parser.parse(BBS_MOTD);
    this.parser.parse('\r\n\x1b[1;33m(Press ENTER to continue)\x1b[0m ');
    this.setState('PAUSE_MOTD');
  }

  private completeNewUserRegistration(): void {
    this.user.city = this.tempCity;
    this.user.phone = this.tempPhone;
    this.user.securityLevel = 30;
    this.sound.playPcSpeaker(1046, 120);
    const greeting = this.isNewUser ? 'New user registration complete!' : 'Welcome back!';
    this.parser.parse(`\r\n\x1b[1;32m${greeting} Welcome to Metropolis PCBoard, ${this.user.firstName}!\x1b[0m\r\n`);
    this.parser.parse('\x1b[0;37mYou have been granted Security Level 30.\x1b[0m\r\n\r\n');
    this.showSystemStats();
    this.parser.parse(BBS_MOTD);
    this.parser.parse('\r\n\x1b[1;33m(Press ENTER to continue)\x1b[0m ');
    this.setState('PAUSE_MOTD');
  }

  private showSystemStats(): void {
    this.parser.parse(
      `\x1b[1;34m╔══════════════════════════════════════════════════════════════════════════════╗\r\n` +
      `\x1b[1;34m║ \x1b[1;37mCaller: \x1b[1;33m${(this.user.firstName + ' ' + this.user.lastName).padEnd(20)} \x1b[1;37mNode: \x1b[1;32m1   \x1b[1;37mSec Level: \x1b[1;35m${this.user.securityLevel.toString().padEnd(4)} \x1b[1;37mTime Left: \x1b[1;36m${this.user.timeRemaining} mins \x1b[1;34m║\r\n` +
      `\x1b[1;34m╚══════════════════════════════════════════════════════════════════════════════╝\x1b[0m\r\n`
    );
  }

  public displayMainMenu(): void {
    this.setState('MAIN_MENU');
    this.buffer.clearScreen(true);
    if (!this.expertMode) {
      this.parser.parse(MAIN_MENU);
    }
    this.parser.parse(
      `\r\n\x1b[0;37m(${this.user.timeRemaining} min left) \x1b[1;33mCommand? \x1b[0m`
    );
  }

  private handleMainMenuCommand(cmd: string): void {
    switch (cmd) {
      case 'B':
        this.displayBulletins();
        break;
      case 'W':
        this.displayWhoIsOnline();
        break;
      case 'F':
      case 'D':
        this.displayFileDirectory();
        break;
      case 'M':
      case 'R':
      case 'Q':
        this.displayMessagesList();
        break;
      case 'E':
        this.startEnteringMessage();
        break;
      case 'C':
      case 'O':
        this.startSysopChat();
        break;
      case 'L':
        this.startDoorLord();
        break;
      case 'T':
        this.startDoorTradeWars();
        break;
      case 'O':
        this.displayDoorsMenu();
        break;
      case 'V':
        this.displayUserStats();
        break;
      case 'X':
        this.expertMode = !this.expertMode;
        this.parser.parse(`\r\n\x1b[1;32mExpert Mode is now ${this.expertMode ? 'ON (short prompts)' : 'OFF (full menus)'}.\x1b[0m\r\n`);
        this.displayMainMenu();
        break;
      case 'H':
      case '?':
        this.parser.parse(MAIN_MENU);
        this.parser.parse(`\r\n\x1b[1;33mCommand? \x1b[0m`);
        break;
      case 'S':
        this.displaySysopStatus();
        break;
      case 'J':
        this.displayConferences();
        break;
      case 'DOS':
      case 'EXIT':
      case 'G':
        this.displayGoodbye();
        break;
      default:
        this.sound.playPcSpeaker(300, 100);
        this.parser.parse(`\r\n\x1b[1;31mInvalid command '${cmd}'. Type 'H' or '?' for help.\x1b[0m\r\n`);
        this.parser.parse(`\x1b[1;33mCommand? \x1b[0m`);
        break;
    }
  }

  private displayBulletins(): void {
    this.setState('BULLETINS');
    this.buffer.clearScreen(true);
    this.parser.parse(BULLETINS_LIST);
    this.parser.parse('\r\n\x1b[1;33mSelect Bulletin (1-4, 0 to return): \x1b[0m');
  }

  private handleBulletinChoice(choice: string): void {
    switch (choice.trim()) {
      case '1':
        this.buffer.clearScreen(true);
        this.parser.parse(
          `\x1b[1;36m=== BULLETIN 1: HARDWARE & SYSTEM TOPOLOGY ===\x1b[0m\r\n\r\n` +
          `\x1b[1;37mHost Computer:\x1b[0m IBM PC Compatible 486DX4-100 MHz\r\n` +
          `\x1b[1;37mRAM:\x1b[0m 32MB Fast Page Mode (SIMM 72-pin)\r\n` +
          `\x1b[1;37mStorage:\x1b[0m Adaptec 2940 PCI SCSI-2 Controller\r\n` +
          `         Quantum Atlas 2.1GB 7200 RPM Hard Drive\r\n` +
          `         Plextor 4Plex 4X SCSI CD-ROM Drive\r\n` +
          `\x1b[1;37mModems:\x1b[0m USRobotics Courier V.34 Dual Standard 28.8kbps (Node 1)\r\n` +
          `        Hayes Optima 14.4k (Node 2-4)\r\n` +
          `\x1b[1;37mOperating System:\x1b[0m MS-DOS 6.22 + DESQview 2.60 Multi-Tasker\r\n` +
          `\x1b[1;37mBBS Software:\x1b[0m Clark Development PCBoard v15.22/i386\r\n\r\n` +
          `\x1b[1;33m(Press ENTER to return to Bulletins)\x1b[0m `
        );
        break;
      case '2':
        this.buffer.clearScreen(true);
        this.parser.parse(
          `\x1b[1;36m=== BULLETIN 2: BBS RULES & POLICIES ===\x1b[0m\r\n\r\n` +
          `1. Respect other callers in message areas and multi-node chat.\r\n` +
          `2. 60 minute daily time limit for standard callers.\r\n` +
          `3. 1:3 Upload/Download ratio enforced for file downloads.\r\n` +
          `4. No hacking, cracking, or unauthorized attempts on SysOp console.\r\n` +
          `5. Have fun and enjoy the golden era of telecomputing!\r\n\r\n` +
          `\x1b[1;33m(Press ENTER to return to Bulletins)\x1b[0m `
        );
        break;
      case '3':
        this.buffer.clearScreen(true);
        this.parser.parse(
          `\x1b[1;36m=== BULLETIN 3: SITE RELIABILITY ENGINEERING REPORT ===\x1b[0m\r\n\r\n` +
          `\x1b[1;32mService Level Indicators (SLI):\x1b[0m\r\n` +
          `- Node Dial-In Success Rate: 99.98%\r\n` +
          `- ZMODEM CRC-32 Transfer Error Rate: < 0.001%\r\n` +
          `- Power Availability: Dual redundant UPS with automated surge suppression\r\n` +
          `- Disaster Recovery: Daily tape differential backups rotated off-site\r\n` +
          `- Mean Time To Detect (MTTD): < 15 seconds via hardware ring detect\r\n` +
          `- Mean Time To Recover (MTTR): < 2 minutes with automated node restart\r\n\r\n` +
          `\x1b[1;33m(Press ENTER to return to Bulletins)\x1b[0m `
        );
        break;
      case '4':
        this.buffer.clearScreen(true);
        this.parser.parse(
          `\x1b[1;36m=== BULLETIN 4: HISTORY OF PCBOARD & CLARK DEVELOPMENT ===\x1b[0m\r\n\r\n` +
          `PCBoard was created in 1983 by Clark Whisler and Fred Clark of\r\n` +
          `Clark Development Company (CDC) in Murray, Utah.\r\n` +
          `It grew into one of the most powerful and scalable commercial BBS\r\n` +
          `packages in the world, renowned for its PCBoard Programming Executable\r\n` +
          `(PPE) scripting engine, multi-node capabilities, and robust file areas.\r\n\r\n` +
          `\x1b[1;33m(Press ENTER to return to Bulletins)\x1b[0m `
        );
        break;
      case '0':
      case '':
        this.displayMainMenu();
        break;
      default:
        this.displayBulletins();
        break;
    }
  }

  private displayWhoIsOnline(): void {
    this.setState('WHO_ONLINE');
    this.buffer.clearScreen(true);
    const screen = WHO_IS_ONLINE.replace('{CURRENT_USER}', `${this.user.firstName} ${this.user.lastName}`.padEnd(20));
    this.parser.parse(screen);
    this.parser.parse('\r\n\x1b[1;33m(Press ENTER to return to Main Menu)\x1b[0m ');
  }

  private displayFileDirectory(): void {
    this.setState('FILES');
    this.buffer.clearScreen(true);
    this.parser.parse(FILE_DIRECTORY);
    this.parser.parse(
      `\r\n\x1b[1;37mCommands: \x1b[1;33m[D]\x1b[0;37mownload, \x1b[1;33m[V]\x1b[0;37miew Info, \x1b[1;33m[Q]\x1b[0;37muit to Main Menu\r\n` +
      `\x1b[1;33mFile command? \x1b[0m`
    );
  }

  private handleFilesChoice(choice: string): void {
    if (choice === 'D' || choice.startsWith('D ')) {
      const filename = choice.length > 2 ? choice.slice(2).trim() : 'PCB1522.ZIP';
      this.simulateZmodemDownload(filename);
      return;
    }

    if (choice === 'Q' || choice === '') {
      this.displayMainMenu();
      return;
    }

    this.parser.parse(`\r\n\x1b[0;37mFile selected: PCB1522.ZIP (PCBoard BBS suite).\x1b[0m\r\n`);
    this.parser.parse(`\x1b[1;33mType 'D' to download or 'Q' to quit: \x1b[0m`);
  }

  private async simulateZmodemDownload(filename: string): Promise<void> {
    this.setState('DOWNLOADING');
    this.user.filesDownloaded++;
    this.buffer.clearScreen(true);
    this.parser.parse(`\x1b[1;36mInitializing ZMODEM protocol transfer for ${filename}...\x1b[0m\r\n\r\n`);
    this.sound.playPcSpeaker(600, 60);

    const totalBlocks = 20;
    for (let b = 1; b <= totalBlocks; b++) {
      const pct = Math.round((b / totalBlocks) * 100);
      const bar = '█'.repeat(b) + '░'.repeat(totalBlocks - b);
      const cps = 2850 + Math.floor(Math.random() * 200);

      this.parser.parse(
        `\r\x1b[1;37mZMODEM: \x1b[1;32m[${bar}] ${pct}% \x1b[0;37m| Block: ${b}/${totalBlocks} | CPS: ${cps} | CRC-32: OK\x1b[0m`
      );
      await this.delay(120);
    }

    this.sound.playPcSpeaker(1200, 150);
    this.parser.parse(`\r\n\r\n\x1b[1;32mTransfer Complete: 100% verified. 0 retries.\x1b[0m\r\n`);
    this.parser.parse(`\x1b[1;33m(Press ENTER to return to Main Menu)\x1b[0m `);
  }

  private displayMessagesList(): void {
    this.setState('MESSAGES_LIST');
    this.buffer.clearScreen(true);
    this.parser.parse(
      `\x1b[1;36m╔══════════════════════════════════════════════════════════════════════════════╗\r\n` +
      `\x1b[1;36m║                  \x1b[1;33mCONFERENCE 0: GENERAL MESSAGE BASE                          \x1b[1;36m║\r\n` +
      `\x1b[1;36m╠════╦══════════════════════╦══════════════════════╦════════════╦══════════════╣\r\n` +
      `\x1b[1;36m║ \x1b[1;33m#  \x1b[1;36m║ \x1b[1;33mFrom                 \x1b[1;36m║ \x1b[1;33mTo                   \x1b[1;36m║ \x1b[1;33mDate       \x1b[1;36m║ \x1b[1;33mSubject      \x1b[1;36m║\r\n` +
      `\x1b[1;36m╠════╬══════════════════════╬══════════════════════╬════════════╬══════════════╣\x1b[0m\r\n`
    );

    this.messages.forEach((msg, idx) => {
      const num = (idx + 1).toString().padEnd(2);
      const from = msg.from.slice(0, 20).padEnd(20);
      const to = msg.to.slice(0, 20).padEnd(20);
      const date = msg.date.padEnd(10);
      const subj = msg.subject.slice(0, 12).padEnd(12);
      this.parser.parse(`\x1b[1;36m║ \x1b[1;37m${num} \x1b[1;36m║ \x1b[0;37m${from} \x1b[1;36m║ \x1b[0;37m${to} \x1b[1;36m║ \x1b[0;37m${date} \x1b[1;36m║ \x1b[1;33m${subj} \x1b[1;36m║\r\n`);
    });

    this.parser.parse(
      `\x1b[1;36m╚════╩══════════════════════╩══════════════════════╩════════════╩══════════════╝\x1b[0m\r\n` +
      `\x1b[1;37mCommands: \x1b[1;33m[1-${this.messages.length}]\x1b[0;37m Read Message, \x1b[1;33m[E]\x1b[0;37mnter Message, \x1b[1;33m[Q]\x1b[0;37muit\r\n` +
      `\x1b[1;33mMessage command? \x1b[0m`
    );
  }

  private handleMessagesChoice(choice: string): void {
    const num = parseInt(choice, 10);
    if (!isNaN(num) && num >= 1 && num <= this.messages.length) {
      this.selectedMsgIdx = num - 1;
      this.viewCurrentMessage();
      return;
    }

    if (choice === 'E') {
      this.startEnteringMessage();
      return;
    }

    if (choice === 'Q' || choice === '') {
      this.displayMainMenu();
      return;
    }

    this.displayMessagesList();
  }

  private viewCurrentMessage(): void {
    this.setState('MESSAGE_READ');
    this.buffer.clearScreen(true);
    const msg = this.messages[this.selectedMsgIdx];
    this.parser.parse(
      `\x1b[1;34m╔══════════════════════════════════════════════════════════════════════════════╗\r\n` +
      `\x1b[1;34m║ \x1b[1;37mMessage: \x1b[1;33m#${this.selectedMsgIdx + 1} of ${this.messages.length} \x1b[1;30m| \x1b[1;37mDate: \x1b[0;37m${msg.date.padEnd(12)} \x1b[1;30m| \x1b[1;37mConference: \x1b[1;32m0 (General)    \x1b[1;34m║\r\n` +
      `\x1b[1;34m║ \x1b[1;37mFrom:    \x1b[1;36m${msg.from.padEnd(30)} \x1b[1;37mTo: \x1b[1;36m${msg.to.padEnd(25)} \x1b[1;34m║\r\n` +
      `\x1b[1;34m║ \x1b[1;37mSubject: \x1b[1;33m${msg.subject.padEnd(66)} \x1b[1;34m║\r\n` +
      `\x1b[1;34m╠══════════════════════════════════════════════════════════════════════════════╣\x1b[0m\r\n`
    );

    msg.body.forEach(line => {
      this.parser.parse(`\x1b[0;37m  ${line}\x1b[0m\r\n`);
    });

    this.parser.parse(
      `\x1b[1;34m╚══════════════════════════════════════════════════════════════════════════════╝\x1b[0m\r\n` +
      `\x1b[1;37m[N]ext message, [R]eturn to list, [Q]uit to Main Menu: \x1b[0m`
    );
  }

  private startEnteringMessage(): void {
    this.setState('MSG_ENTER_TO');
    this.buffer.clearScreen(true);
    this.parser.parse(`\x1b[1;33m=== ENTER NEW MESSAGE ===\x1b[0m\r\n`);
    this.parser.parse(`\x1b[1;37mFrom: \x1b[1;32m${this.user.firstName} ${this.user.lastName}\x1b[0m\r\n`);
    this.parser.parse(`\x1b[1;37mTo (default: All): \x1b[0m`);
  }

  private finishEnteringMessage(): void {
    const today = new Date();
    const dateStr = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}-${today.getFullYear()}`;

    const newMsg: BbsMessage = {
      id: this.messages.length + 1,
      from: `${this.user.firstName} ${this.user.lastName}`,
      to: this.currentMsgDraft.to,
      date: dateStr,
      subject: this.currentMsgDraft.subject,
      body: this.currentMsgDraft.body.length > 0 ? this.currentMsgDraft.body : ['(No message content)'],
    };

    this.messages.push(newMsg);
    this.saveMessages();
    this.sound.playPcSpeaker(950, 120);

    this.parser.parse(`\r\n\x1b[1;32mMessage #${newMsg.id} saved to Conference 0!\x1b[0m\r\n`);
    this.parser.parse(`\x1b[1;33m(Press ENTER for Main Menu)\x1b[0m `);
    this.setState('PAUSE_MAIL');
  }

  private displayDoorsMenu(): void {
    this.setState('DOORS');
    this.buffer.clearScreen(true);
    this.parser.parse(
      `\x1b[1;35m╔══════════════════════════════════════════════════════════════════════════════╗\r\n` +
      `\x1b[1;35m║                         \x1b[1;33mONLINE BBS DOOR GAMES                                \x1b[1;35m║\r\n` +
      `\x1b[1;35m╠══════════════════════════════════════════════════════════════════════════════╣\r\n` +
      `\x1b[1;35m║  \x1b[1;37m[1] \x1b[1;31mLegend of the Red Dragon (L.O.R.D. v4.00)                               \x1b[1;35m║\r\n` +
      `\x1b[1;35m║  \x1b[1;37m[2] \x1b[1;32mTradeWars 2002 (v2.00 Space Conquest)                                   \x1b[1;35m║\r\n` +
      `\x1b[1;35m║  \x1b[1;37m[3] \x1b[1;36mSolar Realms Elite (SRE v1.0)                                           \x1b[1;35m║\r\n` +
      `\x1b[1;35m║  \x1b[1;37m[0] \x1b[0;37mReturn to Main Menu                                                     \x1b[1;35m║\r\n` +
      `\x1b[1;35m╚══════════════════════════════════════════════════════════════════════════════╝\x1b[0m\r\n` +
      `\x1b[1;33mSelect Door Game: \x1b[0m`
    );
  }

  private handleDoorsChoice(choice: string): void {
    switch (choice) {
      case '1':
      case 'L':
        this.startDoorLord();
        break;
      case '2':
      case 'T':
        this.startDoorTradeWars();
        break;
      case '3':
      case 'S':
        this.parser.parse(`\r\n\x1b[1;36mSolar Realms Elite (SRE) node busy. Running on Node 2.\x1b[0m\r\n`);
        this.displayDoorsMenu();
        break;
      default:
        this.displayMainMenu();
        break;
    }
  }

  private startDoorLord(): void {
    this.setState('DOOR_LORD');
    this.buffer.clearScreen(true);
    this.parser.parse(DOOR_LORD_INTRO);
    this.parser.parse(`\x1b[1;33mLORD Command [F,I,W,S,Q]? \x1b[0m`);
  }

  private handleLordAction(action: string): void {
    switch (action) {
      case 'F':
        this.sound.playPcSpeaker(440, 80);
        this.parser.parse(
          `\r\n\x1b[1;31mA wild Goblin jumps out from behind an ancient oak!\x1b[0m\r\n` +
          `\x1b[0;37mYou swing your Rusty Shortsword for 14 damage!\x1b[0m\r\n` +
          `\x1b[1;32mThe Goblin falls dead! You found 32 Gold and gained 45 EXP!\x1b[0m\r\n\r\n` +
          `\x1b[1;33mLORD Command [F,I,W,S,Q]? \x1b[0m`
        );
        break;
      case 'I':
        this.parser.parse(
          `\r\n\x1b[1;33mViolet the barmaid smiles warmly as you enter the tavern.\x1b[0m\r\n` +
          `\x1b[0;37m"Care for an ale, brave warrior? Only 5 gold coins!"\x1b[0m\r\n` +
          `\x1b[0;32mYou take a drink. Your hit points are fully restored!\x1b[0m\r\n\r\n` +
          `\x1b[1;33mLORD Command [F,I,W,S,Q]? \x1b[0m`
        );
        break;
      case 'W':
        this.parser.parse(
          `\r\n\x1b[1;37mAbdul greets you: "Greetings warrior! Steel swords, chain mail, and shields in stock!"\x1b[0m\r\n\r\n` +
          `\x1b[1;33mLORD Command [F,I,W,S,Q]? \x1b[0m`
        );
        break;
      case 'S':
        this.parser.parse(
          `\r\n\x1b[1;36mWarrior: ${this.user.firstName} | Level: 3 | HP: 45/45 | Gold: 180 | Weapon: Iron Broadsword\x1b[0m\r\n\r\n` +
          `\x1b[1;33mLORD Command [F,I,W,S,Q]? \x1b[0m`
        );
        break;
      case 'Q':
      default:
        this.parser.parse(`\r\n\x1b[1;32mSaving character stats... Returning to PCBoard BBS.\x1b[0m\r\n`);
        this.displayMainMenu();
        break;
    }
  }

  private startDoorTradeWars(): void {
    this.setState('DOOR_TW2002');
    this.buffer.clearScreen(true);
    this.parser.parse(DOOR_TW2002_INTRO);
    this.parser.parse(`\x1b[1;33mTW2002 Command [D,P,M,Q]? \x1b[0m`);
  }

  private handleTwAction(action: string): void {
    switch (action) {
      case 'D':
        this.parser.parse(
          `\r\n\x1b[1;36mDocking clamp engaged at StarDock Core...\x1b[0m\r\n` +
          `\x1b[0;37mShipyard: Merchant Cruiser | Holds: 20 | Fighters: 50 | Credits: 2,500\x1b[0m\r\n\r\n` +
          `\x1b[1;33mTW2002 Command [D,P,M,Q]? \x1b[0m`
        );
        break;
      case 'P':
        this.parser.parse(
          `\r\n\x1b[1;32mTrading with StarDock Port: Buying 10 Equipment at 42 credits each.\x1b[0m\r\n` +
          `\x1b[1;33mCargo holds now full!\x1b[0m\r\n\r\n` +
          `\x1b[1;33mTW2002 Command [D,P,M,Q]? \x1b[0m`
        );
        break;
      case 'M':
        this.sound.playPcSpeaker(700, 100);
        this.parser.parse(
          `\r\n\x1b[1;35mWarp drive engaged! Warping from Sector 1 to Sector 2...\x1b[0m\r\n` +
          `\x1b[1;37mEntering Sector 2. Uncharted territory. Density scanner clean.\x1b[0m\r\n\r\n` +
          `\x1b[1;33mTW2002 Command [D,P,M,Q]? \x1b[0m`
        );
        break;
      case 'Q':
      default:
        this.parser.parse(`\r\n\x1b[1;32mTransmitting flight recorder... Exiting TradeWars 2002.\x1b[0m\r\n`);
        this.displayMainMenu();
        break;
    }
  }

  private startSysopChat(): void {
    this.setState('SYSOP_CHAT');
    this.buffer.clearScreen(true);
    this.parser.parse(
      `\x1b[1;35m╔══════════════════════════════════════════════════════════════════════════════╗\r\n` +
      `\x1b[1;35m║                          \x1b[1;33mPAGING SYSOP CONSOLE                                \x1b[1;35m║\r\n` +
      `\x1b[1;35m╚══════════════════════════════════════════════════════════════════════════════╝\x1b[0m\r\n` +
      `\x1b[1;37mPaging SysOp Fred Clark & Smford... \x1b[0m\r\n`
    );

    this.sound.playSysopPage();

    setTimeout(() => {
      this.parser.parse(`\r\n\x1b[1;32m[SysOp Connected]\x1b[0m \x1b[1;33mFred Clark: \x1b[0;37m"Hello ${this.user.firstName}! Thanks for calling Metropolis PCBoard. How can I help you today?"\x1b[0m\r\n`);
      this.parser.parse(`\x1b[1;36mType your message below (type 'EXIT' or 'QUIT' to return to Main Menu):\x1b[0m\r\n`);
      this.parser.parse(`\x1b[1;37m${this.user.firstName}> \x1b[0m`);
    }, 1200);
  }

  private handleSysopChat(msg: string): void {
    if (msg.toUpperCase() === 'EXIT' || msg.toUpperCase() === 'QUIT') {
      this.parser.parse(`\r\n\x1b[1;33mSysOp: "Catch you later on the boards! Keep the baud rate high!"\x1b[0m\r\n`);
      this.displayMainMenu();
      return;
    }

    const responses = [
      `"Glad to hear it! Our 28.8k node has been rock solid since we tuned the serial buffer UART 16550."`,
      `"Have you checked out the new ANSI art packs in Conference 0? Some real masterpieces in there."`,
      `"TradeWars 2002 turn reset happens at midnight. Watch out for the corporate raiders in Sector 5!"`,
      `"As an SRE, our target is five nines of BBS availability. 24/7 dial-up reliability is our pride!"`,
      `"Feel free to post a note on the message base if you want to request any new shareware files."`,
    ];

    const pick = responses[Math.floor(Math.random() * responses.length)];
    this.sound.playPcSpeaker(850, 60);

    setTimeout(() => {
      this.parser.parse(`\r\n\x1b[1;33mSysOp: \x1b[0;37m${pick}\x1b[0m\r\n`);
      this.parser.parse(`\x1b[1;37m${this.user.firstName}> \x1b[0m`);
    }, 400);
  }

  private displayUserStats(): void {
    this.setState('USER_STATS');
    this.buffer.clearScreen(true);
    const elapsedMinutes = Math.max(1, Math.round((Date.now() - this.sessionStartTime) / 60000));
    this.parser.parse(
      `\x1b[1;33m╔══════════════════════════════════════════════════════════════════════════════╗\r\n` +
      `\x1b[1;33m║                          \x1b[1;37mCALLER ACCOUNT STATISTICS                           \x1b[1;33m║\r\n` +
      `\x1b[1;33m╠══════════════════════════════════════════════════════════════════════════════╣\r\n` +
      `\x1b[1;33m║ \x1b[0;37mUser Name:       \x1b[1;37m${(this.user.firstName + ' ' + this.user.lastName).padEnd(25)} \x1b[0;37mSecurity Level:  \x1b[1;35m${this.user.securityLevel.toString().padEnd(10)} \x1b[1;33m║\r\n` +
      `\x1b[1;33m║ \x1b[0;37mCity, State:     \x1b[1;37m${this.user.city.padEnd(25)} \x1b[0;37mTime Elapsed:    \x1b[1;36m${elapsedMinutes} minutes   \x1b[1;33m║\r\n` +
      `\x1b[1;33m║ \x1b[0;37mVoice Phone:     \x1b[1;37m${this.user.phone.padEnd(25)} \x1b[0;37mTime Remaining:  \x1b[1;36m${Math.max(0, this.user.timeRemaining - elapsedMinutes)} minutes   \x1b[1;33m║\r\n` +
      `\x1b[1;33m║ \x1b[0;37mFiles Downloaded:\x1b[1;32m${this.user.filesDownloaded.toString().padEnd(25)} \x1b[0;37mUpload/DL Ratio: \x1b[1;32m1:3            \x1b[1;33m║\r\n` +
      `\x1b[1;33m║ \x1b[0;37mTotal Calls:     \x1b[1;33m${this.user.callsCount.toString().padEnd(25)} \x1b[0;37mNode Connected:  \x1b[1;37mNode 1 (28.8k) \x1b[1;33m║\r\n` +
      `\x1b[1;33m╚══════════════════════════════════════════════════════════════════════════════╝\x1b[0m\r\n` +
      `\r\n\x1b[1;33m(Press ENTER to return to Main Menu)\x1b[0m `
    );
  }

  private displaySysopStatus(): void {
    this.buffer.clearScreen(true);
    this.parser.parse(
      `\x1b[1;32m╔══════════════════════════════════════════════════════════════════════════════╗\r\n` +
      `\x1b[1;32m║                  \x1b[1;37mPCBOARD SYSOP MONITOR & SRE DIAGNOSTICS                     \x1b[1;32m║\r\n` +
      `\x1b[1;32m╠══════════════════════════════════════════════════════════════════════════════╣\r\n` +
      `\x1b[1;32m║ \x1b[1;33mModem DTR:\x1b[1;32m ACTIVE    \x1b[1;33mRTS:\x1b[1;32m ACTIVE    \x1b[1;33mCTS:\x1b[1;32m ACTIVE    \x1b[1;33mCD:\x1b[1;32m CARRIER DETECT (ON)   \x1b[1;32m║\r\n` +
      `\x1b[1;32m║ \x1b[1;33mNode 1 Line Speed: \x1b[1;37m28,800 bps V.34 / V.42bis Data Compression                \x1b[1;32m║\r\n` +
      `\x1b[1;32m║ \x1b[1;33mUART Chipset:      \x1b[1;37m16550A with 16-byte FIFO enabled (0 FIFO overruns)        \x1b[1;32m║\r\n` +
      `\x1b[1;32m║ \x1b[1;33mMemory Allocation: \x1b[1;37m582K Conventional free / 15MB XMS Extended free           \x1b[1;32m║\r\n` +
      `\x1b[1;32m║ \x1b[1;33mSRE Health Status: \x1b[1;32m100% HEALTHY (Zero packet loss, zero dropped frames)      \x1b[1;32m║\r\n` +
      `\x1b[1;32m╚══════════════════════════════════════════════════════════════════════════════╝\x1b[0m\r\n` +
      `\r\n\x1b[1;33m(Press ENTER for Main Menu)\x1b[0m `
    );
    this.setState('PAUSE_MAIL');
  }

  private displayConferences(): void {
    this.buffer.clearScreen(true);
    this.parser.parse(
      `\x1b[1;36m╔══════════════════════════════════════════════════════════════════════════════╗\r\n` +
      `\x1b[1;36m║                         \x1b[1;33mPCBOARD CONFERENCES                                  \x1b[1;36m║\r\n` +
      `\x1b[1;36m╠══════════════════════════════════════════════════════════════════════════════╣\r\n` +
      `\x1b[1;36m║  \x1b[1;37m(0) \x1b[1;32mMain Board & General Telecomputing                                      \x1b[1;36m║\r\n` +
      `\x1b[1;36m║  \x1b[1;37m(1) \x1b[1;32mSite Reliability Engineering & Systems Architecture                     \x1b[1;36m║\r\n` +
      `\x1b[1;36m║  \x1b[1;37m(2) \x1b[1;32mDOS Assembly & C/C++ Programming (Turbo C, Borland)                     \x1b[1;36m║\r\n` +
      `\x1b[1;36m║  \x1b[1;37m(3) \x1b[1;32mANSI Art & Underground Scene (ACiD, iCE, TheDraw)                       \x1b[1;36m║\r\n` +
      `\x1b[1;36m╚══════════════════════════════════════════════════════════════════════════════╝\x1b[0m\r\n` +
      `\r\n\x1b[1;33m(Press ENTER for Main Menu)\x1b[0m `
    );
    this.setState('PAUSE_MAIL');
  }

  private displayGoodbye(): void {
    this.setState('GOODBYE');
    this.buffer.clearScreen(true);
    const elapsed = Math.max(1, Math.round((Date.now() - this.sessionStartTime) / 60000));
    const screen = GOODBYE_SCREEN
      .replace('{CONNECT_TIME}', elapsed.toString())
      .replace('{FILES_DL}', this.user.filesDownloaded.toString())
      .replace('{FILES_UL}', this.user.filesUploaded.toString())
      .replace('{SECURITY_LEVEL}', this.user.securityLevel.toString());

    this.parser.parse(screen);
    this.parser.parse('\r\n\x1b[1;31mNO CARRIER\x1b[0m\r\n\r\n');
    this.sound.playPcSpeaker(400, 200);

    setTimeout(() => {
      this.disconnect();
    }, 1500);
  }

  public disconnect(): void {
    this.setState('IDLE');
    if (this.onDisconnectCallback) {
      this.onDisconnectCallback();
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

import { TextBuffer } from './terminal/TextBuffer';
import { AnsiParser } from './terminal/AnsiParser';
import { CanvasRenderer } from './terminal/CanvasRenderer';
import { SoundSystem } from './audio/SoundSystem';
import { PCBoardSession } from './bbs/PCBoardSession';
import { DosShell } from './dos/DosShell';
import { SysopHud } from './ui/SysopHud';
import { MonitorTheme } from './terminal/types';

class App {
  private buffer: TextBuffer;
  private parser: AnsiParser;
  private renderer: CanvasRenderer;
  private sound: SoundSystem;
  private bbsSession: PCBoardSession;
  private dosShell: DosShell;
  private hud: SysopHud;

  private currentMode: 'DOS' | 'BBS' = 'DOS';
  private baudRate = 28800;

  constructor() {
    const canvas = document.getElementById('terminal-canvas') as HTMLCanvasElement;
    const hudContainer = document.getElementById('hud-container') as HTMLElement;

    if (!canvas || !hudContainer) {
      throw new Error('Required DOM elements missing');
    }

    this.sound = new SoundSystem();
    this.buffer = new TextBuffer();
    this.parser = new AnsiParser(this.buffer, {
      onBell: () => this.sound.playPcSpeaker(800, 100),
      enablePcboardCodes: true,
    });

    this.renderer = new CanvasRenderer(canvas, this.buffer, {
      theme: 'vga',
      crtScanlines: true,
      crtCurvature: false,
      crtBloom: true,
    });

    this.hud = new SysopHud(hudContainer);

    // BBS and DOS engines
    this.bbsSession = new PCBoardSession(this.buffer, this.parser, this.sound);
    this.dosShell = new DosShell(this.buffer, this.parser, this.sound);

    this.setupInteractions();
    this.setupToolbar();
    this.setupKeyboard();
    this.setupSoftKeys();

    // Start in MS-DOS mode
    this.returnToDos();
  }

  private setupInteractions(): void {
    // When DOS launches BBS
    this.dosShell.setOnConnectBbs((phone) => {
      this.startBbs(phone || '555-1994');
    });

    // When BBS hangs up
    this.bbsSession.setOnDisconnect(() => {
      this.returnToDos();
    });

    // When BBS state changes, update HUD
    this.bbsSession.setOnStateChange((state) => {
      if (state === 'DIALING') {
        this.hud.setMode('DIALING...');
        this.hud.updateLeds({ cd: false, ri: true });
      } else if (state === 'GOODBYE' || state === 'IDLE') {
        this.hud.setMode('HANGING UP');
        this.hud.updateLeds({ cd: false, ri: false });
      } else {
        this.hud.setMode(`PCBOARD [${state}]`);
        this.hud.updateLeds({ cd: true, ri: false, dtr: true, cts: true, rts: true });
      }
    });

    // Baud selector in HUD
    this.hud.setOnBaudChange((baud) => {
      this.baudRate = baud;
      const speedStr = this.baudRate > 0 ? `${this.baudRate} bps` : 'LAN DIRECT';
      this.hud.setNodeStatus(`01 [${speedStr}]`);
    });

    // Flash RX on buffer activity
    this.buffer.addChangeListener(() => {
      this.hud.flashRx();
    });
  }

  public async startBbs(_phone = '555-1994'): Promise<void> {
    this.currentMode = 'BBS';
    this.hud.setMode('PCBOARD BBS v15.22');
    this.hud.setNodeStatus('01 [CONNECTING]');
    await this.bbsSession.connect();
    this.hud.setNodeStatus('01 [ONLINE]');
  }

  public returnToDos(): void {
    this.currentMode = 'DOS';
    this.hud.setMode('MS-DOS 6.22');
    this.hud.setNodeStatus('01 [LOCAL]');
    this.hud.updateLeds({ cd: false, ri: false, dtr: true, rts: true, cts: true });
    this.dosShell.initPrompt();
  }

  private setupToolbar(): void {
    const btnConnect = document.getElementById('btn-connect');
    const btnHangup = document.getElementById('btn-hangup');
    const btnSound = document.getElementById('btn-sound');
    const btnClicks = document.getElementById('btn-clicks');
    const btnTheme = document.getElementById('btn-theme');
    const btnScanlines = document.getElementById('btn-scanlines');
    const btnCurve = document.getElementById('btn-curve');
    const btnFullscreen = document.getElementById('btn-fullscreen');
    const btnHelp = document.getElementById('btn-help');
    const modalHelp = document.getElementById('help-modal');
    const modalClose = document.getElementById('modal-close');

    btnConnect?.addEventListener('click', () => {
      this.startBbs('555-1994');
    });

    btnHangup?.addEventListener('click', () => {
      if (this.currentMode === 'BBS') {
        this.bbsSession.disconnect();
      } else {
        this.returnToDos();
      }
    });

    btnSound?.addEventListener('click', () => {
      const isMuted = !this.sound.getMuted();
      this.sound.setMuted(isMuted);
      btnSound.textContent = isMuted ? '🔇 Audio: OFF' : '🔊 Audio: ON';
      btnSound.classList.toggle('active', !isMuted);
    });

    btnClicks?.addEventListener('click', () => {
      const enabled = !this.sound.getKeyClicksEnabled();
      this.sound.setKeyClicksEnabled(enabled);
      btnClicks.textContent = enabled ? '⌨ Clicks: ON' : '⌨ Clicks: OFF';
      btnClicks.classList.toggle('active', enabled);
    });

    const themes: MonitorTheme[] = ['vga', 'amber', 'green'];
    let themeIdx = 0;
    btnTheme?.addEventListener('click', () => {
      themeIdx = (themeIdx + 1) % themes.length;
      const t = themes[themeIdx];
      this.renderer.setTheme(t);
      const labels: Record<MonitorTheme, string> = {
        vga: '📺 Monitor: VGA Color',
        amber: '📺 Monitor: Amber Phosphor',
        green: '📺 Monitor: Green Phosphor',
        cga: '📺 Monitor: CGA',
      };
      btnTheme.textContent = labels[t];
    });

    btnScanlines?.addEventListener('click', () => {
      const active = !this.renderer.getCrtScanlines();
      this.renderer.setCrtScanlines(active);
      btnScanlines.classList.toggle('active', active);
    });

    btnCurve?.addEventListener('click', () => {
      const active = !this.renderer.getCrtCurvature();
      this.renderer.setCrtCurvature(active);
      const container = document.getElementById('terminal-wrapper');
      container?.classList.toggle('crt-curve', active);
      btnCurve.classList.toggle('active', active);
    });

    btnFullscreen?.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    btnHelp?.addEventListener('click', () => {
      modalHelp?.classList.add('visible');
    });

    modalClose?.addEventListener('click', () => {
      modalHelp?.classList.remove('visible');
    });

    modalHelp?.addEventListener('click', (e) => {
      if (e.target === modalHelp) {
        modalHelp.classList.remove('visible');
      }
    });
  }

  private setupKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      // Ignore functional browser hotkeys (F5, F11, F12, etc.)
      if (['F5', 'F11', 'F12'].includes(e.key)) return;

      // Prevent scrolling on space / arrows
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) {
        e.preventDefault();
      }

      this.hud.flashTx();

      if (this.currentMode === 'BBS') {
        this.bbsSession.handleKey(e.key, e);
      } else {
        this.dosShell.handleKey(e.key);
      }
    });
  }

  private setupSoftKeys(): void {
    const keys = document.querySelectorAll<HTMLButtonElement>('.soft-key');
    keys.forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-key');
        if (!key) return;

        this.hud.flashTx();

        if (key === 'ENTER') {
          this.handleKeyInput('Enter');
        } else if (key === 'ESC') {
          this.handleKeyInput('Escape');
        } else if (key === 'BS') {
          this.handleKeyInput('Backspace');
        } else if (key === 'PCBOARD') {
          if (this.currentMode === 'DOS') {
            this.startBbs('555-1994');
          }
        } else {
          this.handleKeyInput(key);
        }
      });
    });
  }

  private handleKeyInput(key: string): void {
    if (this.currentMode === 'BBS') {
      this.bbsSession.handleKey(key);
    } else {
      this.dosShell.handleKey(key);
    }
  }
}

// Boot application when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  new App();
});

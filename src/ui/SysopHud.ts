export interface ModemLeds {
  dtr: boolean;
  rts: boolean;
  cts: boolean;
  cd: boolean;
  ri: boolean;
  tx: boolean;
  rx: boolean;
}

export class SysopHud {
  private container: HTMLElement;
  private ledElements: Record<keyof ModemLeds, HTMLElement> = {} as any;
  private statusElement: HTMLElement | null = null;
  private baudSelect: HTMLSelectElement | null = null;
  private onBaudChange?: (baud: number) => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.buildHud();
  }

  public setOnBaudChange(cb: (baud: number) => void): void {
    this.onBaudChange = cb;
  }

  private buildHud(): void {
    this.container.innerHTML = `
      <div class="hud-bar">
        <div class="hud-section hardware-leds" title="Hardware Modem RS-232 Status Indicators">
          <div class="led-group"><span class="led" id="led-dtr"></span><label>DTR</label></div>
          <div class="led-group"><span class="led" id="led-rts"></span><label>RTS</label></div>
          <div class="led-group"><span class="led" id="led-cts"></span><label>CTS</label></div>
          <div class="led-group"><span class="led" id="led-cd"></span><label>CD</label></div>
          <div class="led-group"><span class="led" id="led-ri"></span><label>RI</label></div>
          <div class="led-group"><span class="led" id="led-tx"></span><label>TX</label></div>
          <div class="led-group"><span class="led" id="led-rx"></span><label>RX</label></div>
        </div>

        <div class="hud-section system-info">
          <span class="info-label">SYSTEM:</span>
          <span class="info-value" id="hud-mode">MS-DOS 6.22</span>
          <span class="separator">|</span>
          <span class="info-label">NODE:</span>
          <span class="info-value" id="hud-node">01 [READY]</span>
          <span class="separator">|</span>
          <span class="info-label">BAUD:</span>
          <select id="baud-selector" class="retro-select" title="Simulated Line Speed">
            <option value="0">Instant (LAN)</option>
            <option value="57600">57,600 V.90</option>
            <option value="28800" selected>28,800 V.34</option>
            <option value="14400">14,400 V.32bis</option>
            <option value="9600">9,600 V.32</option>
            <option value="2400">2,400 V.22bis</option>
            <option value="300">300 Bell 103</option>
          </select>
        </div>
      </div>
    `;

    this.ledElements.dtr = this.container.querySelector('#led-dtr')!;
    this.ledElements.rts = this.container.querySelector('#led-rts')!;
    this.ledElements.cts = this.container.querySelector('#led-cts')!;
    this.ledElements.cd = this.container.querySelector('#led-cd')!;
    this.ledElements.ri = this.container.querySelector('#led-ri')!;
    this.ledElements.tx = this.container.querySelector('#led-tx')!;
    this.ledElements.rx = this.container.querySelector('#led-rx')!;

    this.statusElement = this.container.querySelector('#hud-mode');
    this.baudSelect = this.container.querySelector('#baud-selector');

    if (this.baudSelect) {
      this.baudSelect.addEventListener('change', () => {
        const val = parseInt(this.baudSelect!.value, 10);
        if (this.onBaudChange) {
          this.onBaudChange(val);
        }
      });
    }

    // Default LED states: DTR & RTS active on modem ready
    this.updateLeds({
      dtr: true,
      rts: true,
      cts: true,
      cd: false,
      ri: false,
      tx: false,
      rx: false,
    });
  }

  public updateLeds(leds: Partial<ModemLeds>): void {
    Object.entries(leds).forEach(([key, state]) => {
      const el = this.ledElements[key as keyof ModemLeds];
      if (el) {
        if (state) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      }
    });
  }

  public flashTx(): void {
    if (!this.ledElements.tx) return;
    this.ledElements.tx.classList.add('active');
    setTimeout(() => {
      this.ledElements.tx.classList.remove('active');
    }, 60);
  }

  public flashRx(): void {
    if (!this.ledElements.rx) return;
    this.ledElements.rx.classList.add('active');
    setTimeout(() => {
      this.ledElements.rx.classList.remove('active');
    }, 60);
  }

  public setMode(mode: string): void {
    if (this.statusElement) {
      this.statusElement.textContent = mode;
    }
  }

  public setNodeStatus(status: string): void {
    const el = this.container.querySelector('#hud-node');
    if (el) {
      el.textContent = status;
    }
  }
}

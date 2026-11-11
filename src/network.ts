import { Peer, DataConnection } from 'peerjs';

export type NetworkGameEvent =
  | { type: 'kick_action'; aimX: number; aimY: number; power: number; skill: string }
  | { type: 'keeper_dive'; zone: string; skill: string; reflexBonus: boolean }
  | { type: 'turn_result'; result: string; blueScore: number; redScore: number }
  | { type: 'restart_match' };

export class MultiplayerClient {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  public connected = false;
  public roomId = '';
  public myRole: 'p1' | 'p2' | null = null; // p1 = Host (Blue), p2 = Guest (Red)
  public opponentReady = false;
  public statusMessage = '방 코드를 입력하고 참가하세요.';

  public onMatchReady?: () => void;
  public onGameEvent?: (event: NetworkGameEvent, fromRole: 'p1' | 'p2') => void;
  public onOpponentLeft?: () => void;

  private formatPeerId(roomId: string): string {
    return `sp-shootout-${roomId.trim().toLowerCase()}`;
  }

  public connect(roomId: string): void {
    this.roomId = roomId.trim().toUpperCase() || '1004';
    this.statusMessage = 'P2P 네트워크 접속 중...';

    const hostPeerId = this.formatPeerId(this.roomId);

    // Clean up previous peer if any
    this.disconnect();

    // 1. Try connecting as Guest (P2) first to see if Host exists
    const guestPeer = new Peer();

    guestPeer.on('open', () => {
      this.statusMessage = `방 [${this.roomId}] 접속 시도 중...`;
      const conn = guestPeer.connect(hostPeerId, { reliable: true });

      let hostFound = false;

      conn.on('open', () => {
        hostFound = true;
        this.peer = guestPeer;
        this.conn = conn;
        this.myRole = 'p2';
        this.connected = true;
        this.opponentReady = true;
        this.statusMessage = `방 [${this.roomId}] 입장 완료! (P2 게스트)`;
        this.setupConnectionHandlers(conn);
        if (this.onMatchReady) this.onMatchReady();
      });

      // If connection fails after 1.8 seconds, assume host doesn't exist -> Become Host (P1)!
      setTimeout(() => {
        if (!hostFound && !this.connected) {
          conn.close();
          guestPeer.destroy();
          this.becomeHost(hostPeerId);
        }
      }, 1800);
    });

    guestPeer.on('error', () => {
      if (!this.connected) {
        guestPeer.destroy();
        this.becomeHost(hostPeerId);
      }
    });
  }

  private becomeHost(hostPeerId: string): void {
    this.statusMessage = `방 [${this.roomId}] 생성 중 (P1 호스트)...`;
    const hostPeer = new Peer(hostPeerId);

    hostPeer.on('open', () => {
      this.peer = hostPeer;
      this.myRole = 'p1';
      this.connected = true;
      this.statusMessage = `방 [${this.roomId}] 생성 완료! 상대방(P2) 접속 대기 중...`;
    });

    hostPeer.on('connection', (conn) => {
      this.conn = conn;
      this.opponentReady = true;
      this.statusMessage = `상대방 입장 완료! 경기를 시작합니다!`;
      this.setupConnectionHandlers(conn);
      if (this.onMatchReady) this.onMatchReady();
    });

    hostPeer.on('error', (err) => {
      console.warn('Host error:', err);
      this.statusMessage = `방 생성 실패: 다른 기기에서 이미 열려있거나 네트워크 오류입니다.`;
    });
  }

  private setupConnectionHandlers(conn: DataConnection): void {
    conn.on('data', (data) => {
      try {
        const msg = data as { type: string; event: NetworkGameEvent; from: 'p1' | 'p2' };
        if (msg.type === 'game_event' && this.onGameEvent) {
          this.onGameEvent(msg.event, msg.from);
        }
      } catch (e) {
        console.error(e);
      }
    });

    conn.on('close', () => {
      this.opponentReady = false;
      this.statusMessage = '상대방과의 연결이 끊어졌습니다.';
      if (this.onOpponentLeft) this.onOpponentLeft();
    });
  }

  public sendEvent(event: NetworkGameEvent): void {
    if (this.conn && this.conn.open) {
      this.conn.send({ type: 'game_event', event, from: this.myRole });
    }
  }

  public disconnect(): void {
    if (this.conn) {
      this.conn.close();
      this.conn = null;
    }
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.connected = false;
    this.opponentReady = false;
    this.myRole = null;
  }
}

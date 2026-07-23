import { apiUrl } from "../../lib/api";

export type NetworkStatusListener = (isOnline: boolean) => void;

class NetworkMonitorService {
  private isOnline: boolean = navigator.onLine;
  private listeners: Set<NetworkStatusListener> = new Set();
  private checkInterval: any = null;

  constructor() {
    window.addEventListener("online", this.handleOnline);
    window.addEventListener("offline", this.handleOffline);
    this.startHeartbeat();
  }

  private handleOnline = () => {
    this.checkHealth();
  };

  private handleOffline = () => {
    this.setStatus(false);
  };

  private startHeartbeat() {
    this.checkHealth();
    this.checkInterval = setInterval(() => {
      this.checkHealth();
    }, 15000); // Check server health every 15 seconds
  }

  public async checkHealth(): Promise<boolean> {
    if (!navigator.onLine) {
      this.setStatus(false);
      return false;
    }

    try {
      const res = await fetch(apiUrl("/api/status"), {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(3000)
      });
      const online = res.ok;
      this.setStatus(online);
      return online;
    } catch (_) {
      this.setStatus(false);
      return false;
    }
  }

  private setStatus(online: boolean) {
    if (this.isOnline !== online) {
      this.isOnline = online;
      this.notifyListeners();
    }
  }

  public getStatus(): boolean {
    return this.isOnline;
  }

  public subscribe(listener: NetworkStatusListener): () => void {
    this.listeners.add(listener);
    listener(this.isOnline);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.isOnline));
  }
}

export const NetworkMonitor = new NetworkMonitorService();

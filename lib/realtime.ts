export class RealtimeService {
  private static listeners: Map<string, Set<(data: any) => void>> = new Map()

  static subscribe(channel: string, callback: (data: any) => void) {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set())
    }
    this.listeners.get(channel)?.add(callback)

    return () => {
      this.listeners.get(channel)?.delete(callback)
    }
  }

  static publish(channel: string, data: any) {
    const callbacks = this.listeners.get(channel)
    if (callbacks) {
      callbacks.forEach((callback) => callback(data))
    }
  }

  static on(event: string, callback: (data: any) => void) {
    return this.subscribe(event, callback)
  }

  static emit(event: string, data: any) {
    this.publish(event, data)
  }
}

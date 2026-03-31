import { Message } from '../types';

export class MessageBus {
  private handlers = new Map<string, Set<(message: Message) => void>>();
  private messageLog: Message[] = [];

  // Subscribe to messages
  subscribe(type: string, handler: (message: Message) => void): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    // Return unsubscribe function
    return () => this.handlers.get(type)?.delete(handler);
  }

  // Send message to specific recipient
  send(message: Omit<Message, 'id' | 'timestamp'>): void {
    const fullMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    this.messageLog.push(fullMessage);
    
    // Notify specific recipient
    if (message.to !== 'broadcast') {
      this.handlers.get(message.to)?.forEach(h => h(fullMessage));
    }
    
    // Notify type subscribers
    this.handlers.get(message.type)?.forEach(h => h(fullMessage));
    
    // Notify 'all' subscribers
    this.handlers.get('all')?.forEach(h => h(fullMessage));
  }

  // Get message history
  getMessages(filter?: { from?: string; to?: string; type?: string }): Message[] {
    return this.messageLog.filter(m => {
      if (filter?.from && m.from !== filter.from) return false;
      if (filter?.to && m.to !== filter.to && m.to !== 'broadcast') return false;
      if (filter?.type && m.type !== filter.type) return false;
      return true;
    });
  }

  // Broadcast to all
  broadcast(from: string, type: string, payload: any): void {
    this.send({
      from,
      to: 'broadcast',
      type,
      payload
    });
  }
}

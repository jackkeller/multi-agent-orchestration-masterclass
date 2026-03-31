"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageBus = void 0;
class MessageBus {
    handlers = new Map();
    messageLog = [];
    // Subscribe to messages
    subscribe(type, handler) {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, new Set());
        }
        this.handlers.get(type).add(handler);
        // Return unsubscribe function
        return () => this.handlers.get(type)?.delete(handler);
    }
    // Send message to specific recipient
    send(message) {
        const fullMessage = {
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
    getMessages(filter) {
        return this.messageLog.filter(m => {
            if (filter?.from && m.from !== filter.from)
                return false;
            if (filter?.to && m.to !== filter.to && m.to !== 'broadcast')
                return false;
            if (filter?.type && m.type !== filter.type)
                return false;
            return true;
        });
    }
    // Broadcast to all
    broadcast(from, type, payload) {
        this.send({
            from,
            to: 'broadcast',
            type,
            payload
        });
    }
}
exports.MessageBus = MessageBus;
//# sourceMappingURL=MessageBus.js.map
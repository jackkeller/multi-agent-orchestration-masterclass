import { Message } from '../types';
export declare class MessageBus {
    private handlers;
    private messageLog;
    subscribe(type: string, handler: (message: Message) => void): () => void;
    send(message: Omit<Message, 'id' | 'timestamp'>): void;
    getMessages(filter?: {
        from?: string;
        to?: string;
        type?: string;
    }): Message[];
    broadcast(from: string, type: string, payload: any): void;
}

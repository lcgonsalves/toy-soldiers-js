/** Socket events must be of a given code, otherwise they cannot be handled appropriately */
export declare enum SocketEventCode {
    heartbeat = "heartbeat"
}
/**
 * Events to be transmitted through the websocket. All socket events
 * must implement this interface.
 */
export interface SocketEvent {
    code: SocketEventCode;
    id: number;
    timestamp: Date;
    body: object;
}
export interface SocketEventResponse extends SocketEvent {
}

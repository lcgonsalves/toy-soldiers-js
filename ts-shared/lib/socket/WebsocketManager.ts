import {SocketEvent, SocketEventCode, SocketEventResponse} from "./EventTypes";
import {Subscription, Subject, Observable, fromEvent} from "rxjs";
import * as SocketIO from "socket.io";
import * as SocketIOClient from "socket.io-client";

/**
 * Signature for an event handling callback function.
 */
export type WebsocketEventHandler = (evt: SocketEvent) => SocketEventResponse;


/**
 * Component responsible for managing all event emission and reception
 * over a websocket. This is a parent class that abstracts common methods
 * between client and server.
 */
abstract class AbstractWebsocketManager {
    /** Reference to socket.io library */
    protected _io: SocketIO.Server | SocketIOClient.Socket;
    /** True if this manager is a client manager */
    protected _isClient: boolean;
    /** Tracks subscriptions to a given socket event, for easy clearing */
    protected _subscriptions: Record<SocketEventCode, Array<Subscription>>;

    protected constructor(socketIOReference: SocketIO.Server | SocketIOClient.Socket) {
        if (!socketIOReference) throw new Error("Websocket Manager needs a reference to package.");
        this._io = socketIOReference;
    }

    /**
     * Attaches a handler to the event stream of a given eventCode.
     *
     * @param {SocketEventCode} eventCode the event code of a given SocketEvent
     * @param {Function} handler
     */
    protected abstract on (
      eventCode: SocketEventCode,
      handler: WebsocketEventHandler
    ): Subscription;

    /**
     * Saves the given subscription to subscription list.
     *
     * @param {SocketEventCode} eventCode code of the event for a given subscription
     * @param {Subscription} subscription RXJS subscription for a given code
     * @returns {number} the number of subscriptions to a given event
     */
    protected storeSubscription(eventCode: SocketEventCode, subscription: Subscription): number {
        this._subscriptions[eventCode].push(subscription);
        return this._subscriptions[eventCode].length;
    }

}

export class ServerWebsocketManager extends AbstractWebsocketManager {

    constructor(socketIOReference: SocketIO.Server | SocketIOClient.Socket) {
        super(socketIOReference);
        this._isClient = false;

        this._io.on("connection", (socket: SocketIO.Socket) => {
            socket.on("event", () => {})

            fromEvent(socket, "event").subscribe()
        });

    }

    protected on(
      eventCode: SocketEventCode,
      handler: WebsocketEventHandler
    ): Subscription {
        return null;
    }

}



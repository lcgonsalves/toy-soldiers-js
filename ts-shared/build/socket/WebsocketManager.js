"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerWebsocketManager = void 0;
const rxjs_1 = require("rxjs");
/**
 * Component responsible for managing all event emission and reception
 * over a websocket. This is a parent class that abstracts common methods
 * between client and server.
 */
class AbstractWebsocketManager {
    constructor(socketIOReference) {
        if (!socketIOReference)
            throw new Error("Websocket Manager needs a reference to package.");
        this._io = socketIOReference;
    }
    /**
     * Saves the given subscription to subscription list.
     *
     * @param {SocketEventCode} eventCode code of the event for a given subscription
     * @param {Subscription} subscription RXJS subscription for a given code
     * @returns {number} the number of subscriptions to a given event
     */
    storeSubscription(eventCode, subscription) {
        this._subscriptions[eventCode].push(subscription);
        return this._subscriptions[eventCode].length;
    }
}
class ServerWebsocketManager extends AbstractWebsocketManager {
    constructor(socketIOReference) {
        super(socketIOReference);
        this._isClient = false;
        this._io.on("connection", (socket) => {
            socket.on("event", () => {
            });
            rxjs_1.fromEvent(socket, "event").subscribe();
        });
    }
    on(eventCode, handler) {
        return null;
    }
}
exports.ServerWebsocketManager = ServerWebsocketManager;
//# sourceMappingURL=WebsocketManager.js.map
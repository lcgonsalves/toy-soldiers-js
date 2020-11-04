"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SocketIO = require("socket.io");
class EventTicker {
    /**
     * Due to awkward type checking, use this constructor
     * carefully, or surround with try - catch blocks to be safe.
     *
     * @param {httpServer} server coming from createServer(express())
     */
    constructor(server) {
        this.io = SocketIO(server);
        this.io.on("connection", socket => {
            console.log("hello new user!!!");
            socket.on("message", function (message) {
                console.log(message);
            });
            socket.emit("message", "server says hello!");
        });
    }
}
exports.default = EventTicker;
//# sourceMappingURL=EventTicker.js.map
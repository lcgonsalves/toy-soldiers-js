import * as SocketIO from "socket.io";
import {WebsocketTools as WS} from "ts-shared";

class EventTicker {
    private io: SocketIO.Server;

    /**
     * Due to awkward type checking, use this constructor
     * carefully, or surround with try - catch blocks to be safe.
     *
     * @param {httpServer} server coming from createServer(express())
     */
    constructor(server: any) {
        this.io = SocketIO(server);

        this.io.on("connection", socket => {
            console.log("hello new user!!!");

            socket.on("message", function(message: any) {
                console.log(message);
            });

            socket.emit("message", "server says hello!")

        });

    }

}

export default EventTicker;

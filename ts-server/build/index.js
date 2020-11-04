"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const DefaultRoutes_1 = require("./routes/DefaultRoutes");
const http_1 = require("http");
const EventTicker_1 = require("./server/EventTicker");
/**
 * Singleton server object, provides methods for
 * initializing the HTTP server, and methods for inspecting metadata
 */
class App {
    static get port() { return 80; }
    static init() {
        switch (process.argv[2]) {
            case 'start':
                return App.start();
            default:
                return App.displayHelp();
        }
    }
    static start() {
        // initialize express server
        const app = express();
        const server = http_1.createServer(app);
        // register routes to server here
        DefaultRoutes_1.default.register(app);
        // initialize websocket
        new EventTicker_1.default(server);
        // initialize game module
        // begin listening
        server.listen(App.port, () => { console.log(`Listening on port ${App.port}`); });
    }
    static displayHelp() { console.log('usage: index.ts [ start ]'); }
}
App.init();
//# sourceMappingURL=index.js.map
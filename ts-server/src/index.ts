import * as express from "express";
import {Express} from "express";
import DefaultRoutes from "./routes/DefaultRoutes";
import {createServer} from "http";
import * as SocketIO from "socket.io";
import EventTicker from "./server/EventTicker";

/**
 * Singleton server object, provides methods for
 * initializing the HTTP server, and methods for inspecting metadata
 */
abstract class App {

    static get port(): number { return 80 }

    static init(): any {

        switch (process.argv[2]) {

            case 'start':
                return App.start();
            default:
                return App.displayHelp();

        }
    }


    static start(): void {

        // initialize express server
        const app = express();
        const server = createServer(app);

        // register routes to server here
        DefaultRoutes.register(app);

        // initialize websocket
        new EventTicker(server);

        // initialize game module

        // begin listening
        server.listen(App.port, () => { console.log(`Listening on port ${App.port}`) });

    }

    static displayHelp() { console.log('usage: index.ts [ start ]')}
}

App.init();

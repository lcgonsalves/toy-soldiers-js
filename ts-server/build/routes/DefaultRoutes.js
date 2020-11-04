"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const StatusCodes_1 = require("./StatusCodes");
const path = require("path");
/**
 * Wrapper to assign routes to a given
 */
class DefaultRoutes {
    constructor() {
        this.serverReference = null;
    }
    /**
     * Assigns all handlers for this router, and assigns
     * router to given server. This is a one-time operation.
     *
     * @param {Express} server the initialized express server
     */
    register(server) {
        console.log("Registering routes to server...");
        if (this.serverReference) {
            console.error(`${DefaultRoutes.name} already registered for this server!`);
            throw new Error(`${DefaultRoutes.name}: you can only register routes once.`);
        }
        else {
            const router = express_1.Router();
            router.use(express_1.static(path.join(__dirname, "../../static/ts-game-build/")));
            // register routes here!
            router.get("/", DefaultRoutes.home);
            this.serverReference = server;
            server.use(router);
            return router;
        }
    }
    /**
     * Serves game build html file.
     *
     * @param {Request} request
     * @param {Response} response
     */
    static home(request, response) {
        response.status(StatusCodes_1.default.OK);
        response.setHeader("Content-Type", "text/html");
        response.sendFile(path.join(__dirname, '../../static/ts-game-build/', 'index.html'));
    }
}
exports.default = new DefaultRoutes();
//# sourceMappingURL=DefaultRoutes.js.map
import {Express, Router, Request, Response, static as serveStatic} from "express";
import StatusCodes from "./StatusCodes";
import * as path from "path";

/**
 * Wrapper to assign routes to a given
 */
class DefaultRoutes {
    serverReference: Express = null;

    /**
     * Assigns all handlers for this router, and assigns
     * router to given server. This is a one-time operation.
     *
     * @param {Express} server the initialized express server
     */
    public register(server: Express): Router {
        console.log("Registering routes to server...");
        if (this.serverReference) {

            console.error(`${DefaultRoutes.name} already registered for this server!`);
            throw new Error(`${DefaultRoutes.name}: you can only register routes once.`);

        } else {

            const router = Router();
            router.use(serveStatic(path.join(__dirname, "../../static/ts-game-build/")));

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
    private static home(request: Request, response: Response): void {
        response.status(StatusCodes.OK);
        response.setHeader("Content-Type", "text/html");
        response.sendFile(path.join(__dirname, '../../static/ts-game-build/', 'index.html'));
    }

}

export default new DefaultRoutes();

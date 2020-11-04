"use strict";
// stub for a more useful logger that can save session histories and what not
// todo: actually code this
Object.defineProperty(exports, "__esModule", { value: true });
class Logger {
    /**
     * Logs arguments in console and does not save outputs.
     * @param args
     */
    static _debug(...args) {
        console.log("[\x1b[36mDEBUG\x1b[0m]", ...args);
    }
    /**
     * Logs arguments in console as error.
     *
     * TODO: save outputs to log file.
     *
     * @param args
     */
    static _error(...args) {
        console.log("[\x1b[31mERROR\x1b[0m]", ...args);
    }
    /**
     * Logs arguments in console as warning.
     *
     * TODO: save outputs to log file.
     *
     * @param args
     */
    static _warn(...args) {
        console.log("[\x1b[33mWARNING\x1b[0m]", ...args);
    }
}
exports.default = Logger;
//# sourceMappingURL=Logger.js.map
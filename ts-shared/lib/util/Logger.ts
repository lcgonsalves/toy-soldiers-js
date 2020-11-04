// stub for a more useful logger that can save session histories and what not
// todo: actually code this

abstract class Logger {
    /**
     * Logs arguments in console and does not save outputs.
     * @param args
     */
    public static _debug(...args: any[]) {
        console.log("[\x1b[36mDEBUG\x1b[0m]", ...args);
    }

    /**
     * Logs arguments in console as error.
     *
     * TODO: save outputs to log file.
     *
     * @param args
     */
    public static _error(...args: any[]) {
        console.log("[\x1b[31mERROR\x1b[0m]", ...args);
    }

    /**
     * Logs arguments in console as warning.
     *
     * TODO: save outputs to log file.
     *
     * @param args
     */
    public static _warn(...args: any[]) {
        console.log("[\x1b[33mWARNING\x1b[0m]", ...args);
    }
}

export default Logger;

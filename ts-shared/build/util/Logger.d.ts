declare abstract class Logger {
    /**
     * Logs arguments in console and does not save outputs.
     * @param args
     */
    static _debug(...args: any[]): void;
    /**
     * Logs arguments in console as error.
     *
     * TODO: save outputs to log file.
     *
     * @param args
     */
    static _error(...args: any[]): void;
    /**
     * Logs arguments in console as warning.
     *
     * TODO: save outputs to log file.
     *
     * @param args
     */
    static _warn(...args: any[]): void;
}
export default Logger;

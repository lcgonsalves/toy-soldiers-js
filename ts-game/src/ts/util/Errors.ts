
export class DestinationInvalidError extends Error {
    constructor(msg?: string) {
        super(`LocationUnit destination invalid${msg ? ": " + msg : ""}`);
    }

}
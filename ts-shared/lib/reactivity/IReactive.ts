/**
 * Defines method API for reactive elements. A reactive element can be treated as a
 * static item (evaluated at runtime once) or as an observable whose value is emitted every update.
 */
interface IReactive<Datum> {

    /**
     * Returns most recent value of the datum.
     */
    current(): Datum;

}
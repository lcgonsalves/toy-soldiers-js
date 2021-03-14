/**
 * Segregating self-snapping functionality from other depictables. Not all depictables can
 * or should be able to snap themselves to a position.
 */
export interface ISnappable {

    /** Translates element to the snapping coordinate, as defined in the implementation. */
    snapSelf(): void;

}
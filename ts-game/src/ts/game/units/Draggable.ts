import {ICoordinate, C, Coordinate} from "ts-shared/build/geometry/Coordinate";
import {IDepictable} from "./UnitInterfaces";
import {GenericConstructor} from "ts-shared/build/util/MixinUtil";
import {Subject, Subscription} from "rxjs"
import {drag} from "d3-drag";
import {ISnappable} from "ts-shared/build/util/ISnappable";

/**
 * An element that, when dragged with a mouse, will translate to the mouse position.
 */
export interface IDraggable {

    /** Initializes drag behavior. */
    initializeDrag(): void;

    /**
     * Registers a new action to be performed when IDraggable begins to be dragged.
     * Returns a subscription that should be handled by the caller.
     */
    onDragStart(newAction: (e: DragEvent) => void): Subscription;

    /**
     * Registers a new action to be performed while element is being dragged.
     * Returns a subscription that should be handled by the caller.
     */
    onDrag(newAction: (e: DragEvent) => void): Subscription;

    /**
     * Registers a new action to be performed when IDraggable stops being dragged.
     * Returns a subscription that should be handled by the caller.
     */
    onDragEnd(newAction: (e: DragEvent) => void): Subscription;

}

/**
 * Event that is emitted to drag event observables upon every drag event (start, during, after).
 * Encodes the SVG Group that was dragged, the event object that encodes the JS event information,
 * and the position of the mouse.
 */
export interface DragEvent {
    element: SVGGElement;
    event: any;
    position: ICoordinate
}

/**
 * Parameters that model how the IDraggable should behave.
 *
 * - SnapOnEnd: Calls IDepictable.snap() when drag ends, snapping the element in place.
 * - SnapWhileDragging: Calls IDepictable.snap() during drag operation, limiting free movement of the IDepictable.
 */
export interface DragConfig {
    snapOnEnd: boolean;
    snapWhileDragging: boolean;
}

/**
 * @mixin
 *
 * Injects drag behavior and handlers to a depictable coordinate-like Base class.
 * @param Base the base class.
 */
export function DraggableUnit<T extends GenericConstructor<IDepictable & ICoordinate & ISnappable>>(Base: T) {
    return class Draggable extends Base implements IDraggable {

        public config: DragConfig = {
            snapOnEnd: true,
            snapWhileDragging: false
        };

        private $dragStart: Subject<DragEvent> = new Subject();
        private $dragging: Subject<DragEvent> = new Subject();
        private $dragEnd: Subject<DragEvent> = new Subject();

        // keeping track of the subscriptions
        private defaultHandlers: Subscription[] = [];

        // tracks curson position in order to properly drag independently from the transform of the group
        private lastDragCursorPosition: ICoordinate | undefined;

        initializeDrag(): void {

            // initialize cursor position tracker
            if (!this.lastDragCursorPosition) this.lastDragCursorPosition = Coordinate.origin;

            const {
                $dragStart,
                $dragEnd,
                $dragging,
                config
            } = this;

            // instantiate handlers if this is the first time running
            if (!this.defaultHandlers.length) {

                this.defaultHandlers.push(
                    $dragStart.subscribe((e: DragEvent) => {

                        // simply initialize (or reset) the last cursor position
                        this.lastDragCursorPosition?.translateToCoord(e.position);

                        // move to initial position.
                        this.translateToCoord(e.position);

                        // set grabbed class for visual handling
                        this.anchor?.classed(DragCSS.GRABBED, true);

                    }),
                    $dragging.subscribe((e: DragEvent) => {

                        /* distance to be translated must be calculated between last "virtual position", i.e. the scaled down
                           position of the mouse (the original event coordinates, since the event happens within a transformed SVG group). */
                        const unscaledDistance = this.lastDragCursorPosition?.distanceInComponents(e.position) ?? this.distanceInComponents(e.position);
                        this.lastDragCursorPosition?.translateToCoord(e.position);

                        config.snapWhileDragging ?
                            this.snapSelf() :
                            this.translateBy(unscaledDistance.x, unscaledDistance.y);

                    }),
                    $dragEnd.subscribe((e: DragEvent) => {

                        this.lastDragCursorPosition?.translateToCoord(e.position);

                        // remove grabbed class for visual handling
                        this.anchor?.classed(DragCSS.GRABBED, false);

                        // translate to final coordinate
                        config.snapOnEnd ?
                            this.snapSelf() :
                            this.translateToCoord(e.position);

                    })
                )

            }

            if (this.anchor) {

                const d = drag<any, any>();

                d.on(DragEvents.START, function (this: SVGGElement, event: any): void {

                    $dragStart.next({
                        element: this,
                        event,
                        position: C(event.x, event.y)
                    });

                });

                d.on(DragEvents.DRAG, function (this: SVGGElement, event: any): void {

                    $dragging.next({
                        element: this,
                        event,
                        position: C(event.x, event.y)
                    });

                });

                d.on(DragEvents.END, function (this: SVGGElement, event: any, coords: ICoordinate): void {

                    $dragEnd.next({
                        element: this,
                        event,
                        position: C(event.x, event.y)
                    });

                });

                this.anchor.call(d);

            } else console.warn("Attempting to initialize drag behavior without an anchor. You need an anchor to drag.")

        }

        onDragStart(newAction: (e: DragEvent) => void) {
            return this.$dragStart.subscribe(newAction);
        }

        onDrag(newAction: (e: DragEvent) => void) {
            return this.$dragging.subscribe(newAction);
        }

        onDragEnd(newAction: (e: DragEvent) => void) {
            return this.$dragEnd.subscribe(newAction);
        }


    }
}

// supported events
export enum DragEvents {
    START = "start",
    DRAG = "drag",
    END = "end"
}

// css class and ID definitions
export enum DragCSS {
    GRABBED = "grabbed"
}
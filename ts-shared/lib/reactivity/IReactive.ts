import {Observable, Subscription} from "rxjs";

/**
 * Defines API for elements that emit events when clicked.
 */
export interface IClickable<Datum> {

    /** Observable that emits when a clickable layer is clicked. Observable value is the shape that was clicked. */
    readonly $click: Observable<Datum>;

    /** Assigns a callback to be triggered when IClickable is clicked. Same as _.$mouseEnter.subscribe(observer) */
    onClick(observer: (evt: Datum) => void): Subscription;

}

/**
 * Defines API for elements that emit events when hovered.
 */
export interface IHoverable<Datum> {

    /** Observable that emits every time the mouse leaves one of the layers. Observable value is the position of this event. */
    readonly $mouseLeave: Observable<Datum>;

    /** Observable that emits every time the mouse enters one of the layers. Observable value is the position of this event. */
    readonly $mouseEnter: Observable<Datum>;

    /** Assigns a callback to be triggered when the mouse enters. Same as _.$mouseEnter.subscribe(observer) */
    onMouseEnter(observer: (evt: Datum) => void): Subscription;

    /** Assigns a callback to be triggered when the mouse enters. Same as _.$mouseEnter.subscribe(observer) */
    onMouseLeave(observer: (evt: Datum) => void): Subscription;

}

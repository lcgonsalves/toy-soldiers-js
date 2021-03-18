import {AnySelection} from "../../util/DrawHelpers";
import {Selection} from "d3-selection";
import {ICoordinate, IMovable} from "ts-shared/build/geometry/Coordinate";
import {IDraggable} from "./Draggable";
import {GenericConstructor} from "ts-shared/build/util/MixinUtil";
import {IWorldNode} from "ts-shared/build/graph/LocationNode";
import {ICopiable} from "ts-shared/build/util/ISerializable";
import SVGTags from "../../util/SVGTags";
import {Observable, Subject, Subscription} from "rxjs";
import {IClickable, IHoverable} from "ts-shared/build/reactivity/IReactive";
import {UnitInteraction} from "./BaseUnit";
import {map, throttleTime} from "rxjs/operators";

/**
 * Encompasses operations for mounting, unmounting, and updating element UI.
 */
export interface IDepictable<E extends SVGElement = SVGGElement> {

    /** Depictable elements may be unanchored at any point */
    readonly anchor: Selection<E, any, any, any>  | undefined;

    /** Attaches game unit to a d3 selection, appending elements and assigning event handlers. */
    attachDepictionTo(d3selection: AnySelection): void;

    /** Removes SVG element containing this depictable element. */
    deleteDepiction(): void;

    /** Refreshes depiction to reflect any changes in this Unit's content */
    refresh(): void;

    /** performs deletion routine, clearing subscriptions  */
    delete(): void;

}

export interface IDepictableWithSprite<E extends SVGElement = SVGGElement, S = {}>
    extends IDepictable<E> {

    /** Shape, or composite shape, or other IDepictable (if my code works) can be used to represent this object. */
    readonly sprite: S | undefined

}

export type Sprite<E extends SVGElement> = IDepictable<E> & IMovable<any> & ICopiable & IClickable<ICoordinate> & IHoverable<ICoordinate>

/**
 * Attaches functionality to allow class Base to have a depiction. By defaults, auto-updates depiction upon position changes.
 * @param Base the base class
 *
 * @param sprite
 * @constructor
 */
export function DepictableUnit<
    E extends SVGElement,
    T extends GenericConstructor<IWorldNode> = GenericConstructor<IWorldNode>,
    S extends Sprite<E> = Sprite<E>
    >(Base: T, sprite: S) {

    return class Depictable extends Base
        implements IDepictableWithSprite<SVGGElement, S>,
            IMovable,
            ICoordinate,
            IWorldNode,
            IClickable<UnitInteraction<Depictable>>,
            IHoverable<UnitInteraction<Depictable>>
    {

        anchor: Selection<SVGGElement, IDepictable<E>, any, any> | undefined;
        sprite: S | undefined;

        refreshOnPositionUpdate: Subscription | undefined;
        interactionEmitters: Subscription[] = [];


        readonly $click: Subject<UnitInteraction<this>> = new Subject();
        readonly $mouseEnter: Subject<UnitInteraction<this>> = new Subject();
        readonly $mouseLeave: Subject<UnitInteraction<this>> = new Subject();

        onClick(observer: (evt: UnitInteraction<this>) => void): Subscription {
            return this.$click.subscribe(observer);
        }

        onMouseEnter(observer: (evt: UnitInteraction<this>) => void): Subscription {
            return this.$mouseEnter.subscribe(observer);
        }

        onMouseLeave(observer: (evt: UnitInteraction<this>) => void): Subscription {
            return this.$mouseLeave.subscribe(observer);
        }

        /**
         * Attaches depiction and initializes sprite if not done already.
         * @param d3selection
         */
        attachDepictionTo(d3selection: AnySelection): void {

            // subscribe to position updates
            this.refreshOnPositionUpdate = this.onChange(_ => {
                this.sprite?.translateToCoord(_);
                this.refresh();
            });

            // preprocess selection – add a svg group to contain everything
            const container = d3selection.append<SVGGElement>(SVGTags.SVGGElement)
                .classed(this.name, true);
            this.anchor = container;

            // if we haven't grabbed a copy of the sprite yet, we do it now.
            if (!this.sprite)
                this.sprite = sprite.duplicate();

            // we translate the sprite to the unit
            this.sprite.translateToCoord(this);


            // then we attach it to the selection
            this.sprite.attachDepictionTo(container);

            if (!this.interactionEmitters.length && this.sprite) {
                this.interactionEmitters.push(
                    this.sprite.$mouseEnter.pipe(
                        throttleTime(200),
                        map((coord: ICoordinate) => ({
                            target: this,
                            focus: coord
                        }))
                    ).subscribe(this.$mouseEnter),

                    this.sprite.$mouseLeave.pipe(
                        throttleTime(400),
                        map((coord: ICoordinate) => ({
                            target: this,
                            focus: coord
                        }))
                    ).subscribe(this.$mouseLeave),

                    this.sprite.$click.pipe(
                        map((coord: ICoordinate) => ({
                            target: this,
                            focus: coord
                        }))
                    ).subscribe(this.$click)
                )
            }

        }

        deleteDepiction(): void {
            this.sprite?.deleteDepiction();
            this.anchor?.selectAll("*").remove();
            this.anchor?.remove();
            this.interactionEmitters.forEach(_ => _.unsubscribe());
            this.interactionEmitters = [];
        }

        refresh(): void {
            this.sprite?.refresh();
        }

        /**
         * Subscribes to a given observable, and at every emission, refreshes this depictable.
         * Optionally also calls additional `observer` function.
         * @param observableGetter
         * @param observer
         */
        refreshOn<T>(
            observableGetter: (self: this) => Observable<T>,
            observer?: (update: T) => void
        ): Subscription {

            return observableGetter(this).subscribe((t: T) => {

                // refresh on update
                this.refresh();

                // call accompanying function
                if (!!observer) observer(t);

            });

        }

        delete(): void {
            this.sprite?.delete();
            this.refreshOnPositionUpdate?.unsubscribe();
            this.$positionChange.complete();
        }

    }
}

export type DragHandler = (evt: any, n: IDraggable, coords: ICoordinate) => void
export type Handler = (this: SVGGElement, event: any) => void


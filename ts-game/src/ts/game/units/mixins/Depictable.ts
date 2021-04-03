import {AnySelection} from "../../../util/DrawHelpers";
import {Selection} from "d3-selection";
import {ICoordinate, IMovable} from "ts-shared/build/geometry/Coordinate";
import {GenericConstructor} from "ts-shared/build/util/MixinUtil";
import {IWorldNode} from "ts-shared/build/graph/LocationNode";
import {ICopiable} from "ts-shared/build/util/ISerializable";
import SVGTags from "../../../util/SVGTags";
import {Observable, Subject, Subscription} from "rxjs";
import {IClickable, IHoverable, ITrackable} from "ts-shared/build/reactivity/IReactive";
import {UnitInteraction} from "../BaseUnit";
import {map, throttleTime} from "rxjs/operators";
import {ISocket} from "../../../util/Socket";
import {IMultiLayer} from "../../shape/CompositeShape";

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
    readonly sprite: S | undefined;

    /** Returns this depictable unit's sockets. In my current example app, the sockets would be the "towers" on the "Base" or
     * whatever. */
    readonly sockets: ISocket[];

}

/**
 * The generic refers to the outer SVG element of this sprite, which by default is SVGGElement.
 */
export type Sprite<E extends SVGElement = SVGGElement> = IDepictable<E> & IMultiLayer & IMovable<any> & ICopiable & IClickable<ICoordinate> & IHoverable<ICoordinate> & ITrackable

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

            // now we make the sprite follow the position of the base
            this.sprite.follow(this);

            /*
             * Here we map the interactions that happen on the sprite to an object that contains
             * this and the exact coordinate of the interaction. This can be later use to build
             * roads between specific parts of the sprite, and to associate different actions to diferent
             * parts of the sprite, i.e. hovering the mouse on the middle of the sprite displays the delete option,
             * while hovering on a road connector displays connect / disconnect options.
             */
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
            this.interactionEmitters.forEach(_ => _.unsubscribe());
            this.$positionChange.complete();
        }

        get sockets(): ISocket[] {
            if (!this.anchor || !this.sprite) return [];
            else {

                return this.getSockets();

            }
        }

        /**
         * Internal implementation detail.
         * Override this if you want to define a particular definition of what constitutes a socket.
         * IDK
         * @protected
         */
        protected getSockets(): ISocket[] {

            return this.sprite?.layers.filter(shape => (
                shape.depiction.clickable ||
                shape.depiction.hoverable
            )) ?? [];

        }

    }
}



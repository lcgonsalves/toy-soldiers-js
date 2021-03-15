import {SimpleDepiction} from "../../util/Depiction";
import {Selection} from "d3-selection";
import {ICopiable, ISerializable, SerializableObject, SObj} from "ts-shared/build/util/ISerializable";
import SVGAttrs from "../../util/SVGAttrs";
import {AnySelection} from "../../util/DrawHelpers";
import {IDepictable} from "../units/UnitInterfaces";
import {ICoordinate, IMovable} from "ts-shared/build/geometry/Coordinate";
import {fromEvent, Subject, Subscription} from "rxjs";
import {Events} from "../../util/Events";
import {IClickable, IHoverable} from "ts-shared/build/reactivity/IReactive";
import {map} from "rxjs/operators";

/**
 * Abstract definition of shapes. Contains functionality to render and update a shape in a selection.
 * When implementing specific shapes, you must override the `refreshAttributes` function, that should call anchor.attr(...) for
 * all the shape-specific attributes.
 *
 * i.e. a CircleShape (AbstractShape<SVGCircleElement>) should call anchor.attr(cx, ...).attr(cy, ...) and so on.
 */
export abstract class AbstractShape<AssociatedSVGElement extends SVGElement = SVGElement>
    implements ISerializable,
        IMovable<AbstractShape<AssociatedSVGElement>>,
        ICopiable,
        IDepictable<AssociatedSVGElement>,
        IHoverable<ICoordinate>,
        IClickable<ICoordinate>
{

    readonly name: string;
    readonly depiction: SimpleDepiction;

    private _anchor: Selection<AssociatedSVGElement, any, any, any> | undefined;

    /** Observable that emits every time the mouse enters one of the layers. Observable value is the position of this event. */
    public readonly $mouseEnter: Subject<ICoordinate> = new Subject();

    /** Observable that emits every time the mouse leaves one of the layers. Observable value is the position of this event. */
    public readonly $mouseLeave: Subject<ICoordinate> = new Subject();

    /** Observable that emits when a clickable layer is clicked. Observable value is the shape that was clicked. */
    public readonly $click: Subject<ICoordinate> = new Subject();


    get anchor(): Selection<AssociatedSVGElement, any, any, any> | undefined {
        return this._anchor;
    }

    // for handling subscriptions when mounting / unmounting elements
    private subscriptions: Subscription[] = []

    /** the param {name} should always come from SVGTags */
    protected constructor(name: string, depiction: SimpleDepiction) {
        this.name = name;
        this.depiction = depiction;
    }

    attachDepictionTo(d3selection: AnySelection): void {

        const {
            clickable,
            hoverable
        } = this.depiction;

        // if already anchored somewhere, delete previous first
        if (this._anchor) this.deleteDepiction();

        const anchor = d3selection.append<AssociatedSVGElement>(this.name);

        // safe-ish cast since we just appended
        const node = anchor.node() as AssociatedSVGElement;

        // assign each listener if needed
        if (clickable) {
            this.subscriptions.push(fromEvent(node, Events.click).pipe(map(() => this.center)).subscribe(this.$click));
        }
        if (hoverable) {
            this.subscriptions.push(
                fromEvent(node, Events.mouseenter).pipe(map(() => this.center)).subscribe(this.$mouseEnter),
                fromEvent(node, Events.mouseleave).pipe(map(() => this.center)).subscribe(this.$mouseLeave)
            );
        }

        this._anchor = anchor;
        this.refresh();

    }

    deleteDepiction(): void {

        this.anchor?.remove();
        this._anchor = undefined;
        this.subscriptions.forEach(_ => _.unsubscribe());
        this.subscriptions = [];


    }

    refresh(): void {

        const {
            fill,
            stroke,
            strokeWidth,
            opacity
        } = SVGAttrs;

        this.anchor?.attr(fill, this.depiction.fill)
            .attr(stroke, this.depiction.stroke)
            .attr(strokeWidth, this.depiction.strokeWidth)
            .attr(opacity, this.depiction.opacity);

        this.refreshAttributes();

    }

    /** Returns a string representing the instance of this object at the time of serialization */
    get serialize(): string {
        return this.simplified.toString();
    }

    get simplified(): SerializableObject {

        return SObj({
            name: this.name,
            depiction: this.depiction.simplified
        });

    }

    /** ABSTRACT METHODS TO BE OVERRIDDEN BY CHILD SHAPES */

    /**
     * Updates attributes of this shape by calling anchor.attr() for all of the shape-specific attributes.
     */
    abstract refreshAttributes(): void;

    /**
     * Translates shape to position and refreshes its depiction.
     * @param x
     * @param y
     */
    abstract translateTo(x: number, y: number): AbstractShape<AssociatedSVGElement>;

    /**
     * Translates shape to other coordinate and refreshes its depiction.
     * @param other
     */
    abstract translateToCoord(other: ICoordinate): AbstractShape<AssociatedSVGElement>;

    /**
     * Translates shape by x units horizontally and y units vertically and refreshes its depiction.
     * @param x
     * @param y
     */
    abstract translateBy(x: number, y: number): AbstractShape<AssociatedSVGElement>;

    /**
     * Returns a new instance of this shape.
     */
    abstract duplicate(): this;

    /**
     * Returns a coordinate that represents the center of the shape.
     */
    abstract get center(): ICoordinate;

    onClick(observer: (evt: ICoordinate) => void): Subscription {
        return this.$click.subscribe(observer);
    }

    onMouseEnter(observer: (evt: ICoordinate) => void): Subscription {
        return this.$mouseEnter.subscribe(observer);
    }

    onMouseLeave(observer: (evt: ICoordinate) => void): Subscription {
        return this.$mouseLeave.subscribe(observer);
    }

}



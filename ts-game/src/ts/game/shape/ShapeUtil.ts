import {SimpleDepiction} from "../../util/Depiction";
import SVGTags from "../../util/SVGTags";
import {select, Selection} from "d3-selection";
import {ICopiable, ISerializable, SerializableObject, SObj} from "ts-shared/build/util/ISerializable";
import SVGAttrs from "../../util/SVGAttrs";
import {AnySelection} from "../../util/DrawHelpers";
import {IDepictable} from "../units/UnitInterfaces";
import {C, ICoordinate, IMovable} from "ts-shared/build/geometry/Coordinate";


/**
 * Abstract definition of shapes. Contains functionality to render and update a shape in a selection.
 * When implementing specific shapes, you must override the `refreshAttributes` function, that should call anchor.attr(...) for
 * all the shape-specific attributes.
 *
 * i.e. a CircleShape (AbstractShape<SVGCircleElement>) should call anchor.attr(cx, ...).attr(cy, ...) and so on.
 */
export abstract class AbstractShape<AssociatedSVGElement extends SVGElement = SVGElement>
    implements ISerializable,
        IMovable,
        ICopiable,
        IDepictable<AssociatedSVGElement> {

    readonly name: string;
    readonly depiction: SimpleDepiction;

    private _anchor: Selection<AssociatedSVGElement, this, any, any> | undefined;

    get anchor(): Selection<AssociatedSVGElement, this, any, any> | undefined {
        return this._anchor;
    }

    /** the param {name} should always come from SVGTags */
    protected constructor(name: string, depiction: SimpleDepiction) {
        this.name = name;
        this.depiction = depiction;
    }

    attachDepictionTo(d3selection: AnySelection): void {

        // if already anchored somewhere, delete previous first
        if (this._anchor) this.deleteDepiction();

        this._anchor = d3selection.append<AssociatedSVGElement>(this.name);

        this.refresh();

    }

    deleteDepiction(): void {

        this.anchor?.remove();
        this._anchor = undefined;

    }

    refresh(): void {

        const {
            fill,
            stroke,
            strokeWidth
        } = SVGAttrs;

        this.anchor?.attr(fill, this.depiction.fill)
            .attr(stroke, this.depiction.stroke)
            .attr(strokeWidth, this.depiction.strokeWidth);

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
    abstract translateTo(x: number, y: number): ICoordinate;

    /**
     * Translates shape to other coordinate and refreshes its depiction.
     * @param other
     */
    abstract translateToCoord(other: ICoordinate): ICoordinate;

    /**
     * Translates shape by x units horizontally and y units vertically and refreshes its depiction.
     * @param x
     * @param y
     */
    abstract translateBy(x: number, y: number): ICoordinate;

    /**
     * Returns a new instance of this shape.
     */
    abstract duplicate(): this;

}

export class CompositeShape implements IDepictable, IMovable, ICopiable {

    readonly name: string;
    readonly layers: AbstractShape[] = [];

    get cls(): string { return "." + this.name }

    constructor(name: string, layers: AbstractShape[]) {
        const suffix = "_shape";

        this.name = name.endsWith(suffix) ? name : name + "_shape";
        this.layers = layers;
    }

    translateBy(x: number, y: number): ICoordinate {
        this.layers.forEach(_ => _.translateBy(x,y));

        // todo: review this return value
        return C(x,y);
    }

    translateTo(x: number, y: number): ICoordinate {
        this.layers.forEach(_ => _.translateTo(x,y));

        return C(x,y);
    }

    translateToCoord(other: ICoordinate): ICoordinate {
        this.layers.forEach(_ => _.translateToCoord(other));

        return other;
    }

    private _anchor: Selection<SVGGElement, this, any, any> | undefined;

    get anchor(): Selection<SVGGElement, this, any, any> | undefined {
        return this._anchor;
    }

    attachDepictionTo(d3selection: AnySelection): void {

        this._anchor = d3selection.append<SVGGElement>(SVGTags.SVGGElement)
            .classed(this.name, true);

         this.refresh();

    }

    deleteDepiction(): void {

        this.anchor?.remove();
        this._anchor = undefined;

    }

    refresh(): void {

        const dataJoin = this.anchor?.selectAll<any, AbstractShape>("*")
            .data<AbstractShape>(this.layers, _ => _.serialize);

        dataJoin?.enter().each(function (shape) {
            shape.attachDepictionTo(select(this));
        });

        dataJoin?.each(function (shape) {
            shape.refresh();
        });

        dataJoin?.exit().remove();

    }

    duplicate(): this {
        // @ts-ignore
        return new this.constructor(this.name, this.layers.map(_ => _.duplicate()));
    }


}

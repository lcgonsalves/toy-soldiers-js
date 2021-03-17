import {IDepictable} from "../units/UnitInterfaces";
import {C, Coordinate, ICoordinate, IMovable} from "ts-shared/build/geometry/Coordinate";
import {ICopiable} from "ts-shared/build/util/ISerializable";
import {select, Selection} from "d3-selection";
import {AnySelection} from "../../util/DrawHelpers";
import SVGTags from "../../util/SVGTags";
import {SimpleDepiction} from "../../util/Depiction";
import {AbstractShape} from "./ShapeUtil";
import {CircleShape} from "./CircleShape";
import {LineShape} from "./LineShape";
import {merge, Observable, Subscription} from "rxjs";
import {IClickable, IHoverable} from "ts-shared/build/reactivity/IReactive";

export class CompositeShape implements IDepictable, IMovable, ICopiable, IClickable<ICoordinate>, IHoverable<ICoordinate> {

    readonly name: string;
    readonly center: ICoordinate;
    readonly layers: AbstractShape[] = [];

    get $mouseEnter(): Observable<ICoordinate> { return merge(...this.layers.map(_ => _.$mouseEnter)); }

    get $mouseLeave(): Observable<ICoordinate> { return merge(...this.layers.map(_ => _.$mouseLeave)); }

    get $click(): Observable<ICoordinate> { return merge(...this.layers.map(_ => _.$click)); }

    get cls(): string {
        return "." + this.name
    }

    constructor(name: string, layers: AbstractShape[] = []) {
        const suffix = "_shape";

        this.name = name.endsWith(suffix) ? name : name + "_shape";
        this.layers = layers.map(_ => _.duplicate());
        this.center = new Coordinate(0, 0);

        // hook up individual shapes' listeners to this one

    }

    translateBy(x: number, y: number): ICoordinate {
        this.center.translateBy(x, y);
        this.layers.forEach(_ => _.translateBy(x, y));

        return C(x, y);
    }

    translateTo(x: number, y: number): ICoordinate {
        this.center.translateTo(x, y);
        this.layers.forEach(_ => _.translateTo(x, y));

        return C(x, y);
    }

    /**
     * Calculates distance from the center of the shape to other coordinate,
     * then translates all layers relative to that.
     * @param other
     */
    translateToCoord(other: ICoordinate): ICoordinate {
        const {x, y} = this.center.distanceInComponents(other);

        this.center.translateBy(x, y);
        this.layers.forEach(_ => _.translateBy(x, y));

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

    delete() {
        this.deleteDepiction();
        this.layers.forEach(layer => layer.delete());
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

    /**
     * Adds a circle shape to the layers.
     * @param radius radius of the circle
     * @param positionRelativeToCenter compute a translation from the center
     * @param depiction
     */
    addCircle(
        radius: number,
        positionRelativeToCenter: (c: ICoordinate) => ICoordinate = c => c,
        depiction?: SimpleDepiction
    ): this {
        const c = new CircleShape(radius, positionRelativeToCenter(this.center.copy), depiction);

        // @ts-ignore – it doesnt like this shit, but it works
        this.layers.push(c);
        return this;
    }

    addLine(
        points: ICoordinate[],
        depiction?: SimpleDepiction
    ): this {
        const l = new LineShape(points, depiction);

        // @ts-ignore – it doesnt like this shit, but it works
        this.layers.push(l);
        return this;
    }

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


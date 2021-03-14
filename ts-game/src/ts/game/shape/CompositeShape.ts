import {IDepictable} from "../units/UnitInterfaces";
import {C, Coordinate, ICoordinate, IMovable} from "ts-shared/build/geometry/Coordinate";
import {ICopiable} from "ts-shared/build/util/ISerializable";
import {select, Selection} from "d3-selection";
import {AnySelection, defaultDepictions} from "../../util/DrawHelpers";
import SVGTags from "../../util/SVGTags";
import {SimpleDepiction} from "../../util/Depiction";
import {AbstractShape} from "./ShapeUtil";
import {CircleShape} from "./CircleShape";

export class CompositeShape implements IDepictable, IMovable, ICopiable {

    readonly name: string;
    readonly center: ICoordinate;
    readonly layers: AbstractShape[] = [];

    get cls(): string {
        return "." + this.name
    }

    constructor(name: string, layers: AbstractShape[] = []) {
        const suffix = "_shape";

        this.name = name.endsWith(suffix) ? name : name + "_shape";
        this.layers = layers;
        this.center = new Coordinate(0, 0);
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

}

const baseDepictions = {
    tower: defaultDepictions.grays.light.setStrokeWidth(0.5)
}

export const SampleShapes = {
    dot: new CircleShape(1.3),
    base: new CompositeShape("base")
        .addCircle(1, c => c.translateBy(0, -2.5), baseDepictions.tower)
        .addCircle(1, c => c.translateBy(-2.5, 0), baseDepictions.tower)
        .addCircle(1, c => c.translateBy(2.5, 0),  baseDepictions.tower)
        .addCircle(1, c => c.translateBy(0, 2.5),  baseDepictions.tower)
}

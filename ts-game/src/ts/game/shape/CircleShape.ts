import {Coordinate, ICoordinate} from "ts-shared/build/geometry/Coordinate";
import {SimpleDepiction} from "../../util/Depiction";
import {defaultDepictions} from "../../util/DrawHelpers";
import SVGTags from "../../util/SVGTags";
import SVGAttrs from "../../util/SVGAttrs";
import {AbstractShape} from "./ShapeUtil";

export class CircleShape extends AbstractShape<SVGCircleElement> {

    public readonly center: ICoordinate;

    protected radius: number;

    constructor(
        radius: number = 1,
        center: ICoordinate = Coordinate.origin,
        depiction: SimpleDepiction = defaultDepictions.grays.light
    ) {
        super(SVGTags.SVGCircleElement, depiction);
        this.center = center;
        this.radius = radius;

        this.center.onChange(() => this.refreshAttributes());
    }

    duplicate(): this {
        // @ts-ignore
        return new this.constructor(this.radius, this.center.copy, this.depiction);
    }

    refreshAttributes(): void {

        this.anchor?.attr(SVGAttrs.cx, this.center.x)
            .attr(SVGAttrs.cy, this.center.y)
            .attr(SVGAttrs.r, this.radius);

    }

    translateBy(x: number, y: number): this {
        this.center.translateBy(x, y);
        return this;
    }

    translateTo(x: number, y: number): this {
        this.center.translateTo(x, y);
        return this;
    }

    translateToCoord(other: ICoordinate): this {
        this.center.translateToCoord(other);
        return this;
    }

}
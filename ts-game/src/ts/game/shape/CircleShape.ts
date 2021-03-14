import {Coordinate, ICoordinate} from "ts-shared/build/geometry/Coordinate";
import {SimpleDepiction} from "../../util/Depiction";
import {defaultDepictions} from "../../util/DrawHelpers";
import SVGTags from "../../util/SVGTags";
import SVGAttrs from "../../util/SVGAttrs";
import {AbstractShape} from "./ShapeUtil";

export class CircleShape extends AbstractShape<SVGCircleElement> {

    protected center: ICoordinate;
    protected radius: number;

    constructor(
        center: ICoordinate = Coordinate.origin,
        radius: number = 1,
        depiction: SimpleDepiction = defaultDepictions.grays.light
    ) {
        super(SVGTags.SVGCircleElement, depiction);
        this.center = center;
        this.radius = radius;
    }

    duplicate(): this {
        // @ts-ignore
        return new this.constructor(this.center, this.radius, this.depiction);
    }

    refreshAttributes(): void {

        this.anchor?.attr(SVGAttrs.cx, this.center.x)
            .attr(SVGAttrs.cy, this.center.y)
            .attr(SVGAttrs.r, this.radius);

    }

    translateBy(x: number, y: number): ICoordinate {
        let destination = this.center.translateBy(x, y);
        this.refresh();

        return destination;
    }

    translateTo(x: number, y: number): ICoordinate {
        let destination = this.center.translateTo(x, y);
        this.refresh();

        return destination;
    }

    translateToCoord(other: ICoordinate): ICoordinate {
        let destination = this.center.translateToCoord(other);
        this.refresh();

        return destination;
    }

}
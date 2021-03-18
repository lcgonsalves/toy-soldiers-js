import {Coordinate, ICoordinate} from "ts-shared/build/geometry/Coordinate";
import {SimpleDepiction} from "../../util/Depiction";
import {defaultDepictions} from "../../util/DrawHelpers";
import SVGTags from "../../util/SVGTags";
import SVGAttrs from "../../util/SVGAttrs";
import {AbstractShape} from "./ShapeUtil";

export class CircleShape extends AbstractShape<SVGCircleElement> {

    protected radius: number;

    constructor(
        radius: number = 1,
        center: ICoordinate = Coordinate.origin,
        depiction: SimpleDepiction = defaultDepictions.grays.light
    ) {
        super(SVGTags.SVGCircleElement, depiction);
        this.radius = radius;
        this.translateToCoord(center);

        this.onChange(() => this.refreshAttributes());
    }

    duplicate(): this {
        // @ts-ignore
        return new this.constructor(this.radius, this.simple, this.depiction);
    }

    get copy(): this {
        return this.duplicate();
    }

    refreshAttributes(): void {

        this.anchor?.attr(SVGAttrs.cx, this.x)
            .attr(SVGAttrs.cy, this.y)
            .attr(SVGAttrs.r, this.radius);

    }

    get center(): ICoordinate {
        return this;
    }

}
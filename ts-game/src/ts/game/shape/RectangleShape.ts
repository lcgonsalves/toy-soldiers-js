import {AbstractShape} from "./ShapeUtil";
import {ICoordinate} from "ts-shared/build/geometry/Coordinate";
import Rectangle from "ts-shared/build/geometry/Rectangle";
import {SimpleDepiction} from "../../util/Depiction";
import SVGTags from "../../util/SVGTags";
import SVGAttrs from "../../util/SVGAttrs";
import {defaultDepictions} from "../../util/DrawHelpers";

export class RectangleShape extends AbstractShape<SVGRectElement> {

    bounds: Rectangle;

    constructor(bounds: Rectangle, depiction: SimpleDepiction = defaultDepictions.grays.medium) {
        super(SVGTags.SVGRectElement, depiction);
        this.bounds = bounds;

        // react to bound changes
        this.bounds.onChange(() => this.refreshAttributes());

    }

    get center(): ICoordinate {
        return this.bounds;
    }

    duplicate(): this {
        // @ts-ignore
        return new this.constructor(this.bounds.copy, this.depiction);
    }

    refreshAttributes(): void {

        const {
            topLeft,
            width,
            height
        } = this.bounds;

        this.anchor?.attr(SVGAttrs.x, topLeft.x)
            .attr(SVGAttrs.y, topLeft.y)
            .attr(SVGAttrs.width, width)
            .attr(SVGAttrs.height, height);

    }

    translateBy(x: number, y: number): AbstractShape<SVGRectElement> {
        this.bounds.translateBy(x, y);
        return this;
    }

    translateTo(x: number, y: number): AbstractShape<SVGRectElement> {
        this.bounds.translateTo(x, y);
        return this;
    }

    translateToCoord(other: ICoordinate): AbstractShape<SVGRectElement> {
        this.bounds.translateToCoord(other);
        return this;
    }



}

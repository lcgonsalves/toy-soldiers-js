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
        this.bounds = bounds.copy;

        this.translateToCoord(bounds);

        /*
         * React to this shape's position change by updating the position of the
         * bounds and then by refreshing attributes synchronously. For some reason, reacting to
         * the bounds' position change using Observables doesn't work and I don't have time to find
         * out why.
         */
        this.$positionChange.subscribe(c => {
            this.bounds.translateToCoord(c);
            this.refreshAttributes()
        });

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


}

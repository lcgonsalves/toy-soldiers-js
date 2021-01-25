import {IGraphEdge, IGraphNode} from "ts-shared/build/lib/graph/GraphInterfaces";
import {ICoordinate} from "ts-shared/build/lib/geometry/Coordinate";
import {sq} from "ts-shared/build/lib/util/Shorthands";
import {Selection} from "d3-selection";
import SVGTags from "./SVGTags";
import SVGAttrs from "./SVGAttrs";
import Rectangle from "ts-shared/build/lib/geometry/Rectangle";


export type AnySelection = Selection<any, any, any, any>;

export class RectConfig {
    bounds: Rectangle;
    width: number;
    height: number;
    cls: string;
    fill: string = "white";
    stroke: string = "black";
    strokeWidth: number = 0.4;
    rx: number = 0.2;


    constructor(topLeft: ICoordinate, width: number, height: number, cls: string = "") {
        this.bounds = Rectangle.fromCorners(topLeft, topLeft.copy.translateBy(width, height));
        this.width = width;
        this.height = height;
        this.cls = cls;
    }

    withStroke(s: string): this {

        this.stroke = s;
        return this;

    }

    withFill(f: string): this {

        this.fill = f;
        return this;

    }

    withStrokeWidth(sw: number): this {

        this.strokeWidth = sw;
        return this;

    }

    withRx(rx: number): this {

        this.rx = rx;
        return this;

    }

}

export class TooltipConfig extends RectConfig {
    tip: ICoordinate;
    tipStart: ICoordinate;
    tipEnd: ICoordinate;

    constructor(topLeft: ICoordinate, width: number, height: number, cls: string = "") {
        super(topLeft, width, height, cls);

        this.tipStart = this.bounds.bottomLeft.copy.translateBy(this.width * 0.3, 0);
        this.tipEnd = this.bounds.bottomRight.copy.translateBy(-(this.width * 0.3), 0);
        this.tip = this.bounds.bottomLeft.copy.translateBy(this.width / 2, 1.2);

    }

    /** translates bounds and tip representations to given coordinate */
    translateToCoord(c: ICoordinate): TooltipConfig {

        // get distance from tip to target
        const dist = this.tip.distanceInComponents(c);

        // translate all other components by the parameters
        [
            this.tip,
            this.tipStart,
            this.tipEnd,
            this.bounds
        ].forEach(location => {
                location.translateBy(dist.x, dist.y)
        });

        return this;
    }

}

/** Returns coordinate of point (x1,y1) as defined in the usage of d3.path().arcTo() from a given curvature degree parameter */
export function getArcToTangentPoint(edge: IGraphEdge<IGraphNode, IGraphNode>, intersectingNode?: IGraphNode, bufferRadius: number = 0): ICoordinate {

    const {from, to} = edge;
    const midpoint = from.midpoint(to);
    const curvature = intersectingNode ? intersectingNode.radius + bufferRadius : 0;

    const perpendicularVec = from.perpendicularVector(midpoint);

    const radius = (4 * sq(curvature) + sq(from.distance(to))) / (8 * curvature);
    const degree = radius - curvature;
    const ratio = perpendicularVec.length() / degree;
    const finalVectorA = perpendicularVec.scale(ratio);
    const finalVectorB = finalVectorA.scale(-1);


    // pick final vector based on the shortest distance between apex and intersecting node coord
    let finalVector = intersectingNode &&
    finalVectorA.getEndpoint(midpoint).distance(intersectingNode) >
    finalVectorB.getEndpoint(midpoint).distance(intersectingNode) ?
        finalVectorA :
        finalVectorB;

    return finalVector.getEndpoint(midpoint);

}

export function getCurveRadius(edge: IGraphEdge<IGraphNode, IGraphNode>, intersectingNode?: IGraphNode, bufferRadius: number = 0): number {
    const {from, to} = edge;
    const curvature = intersectingNode ? intersectingNode.radius + bufferRadius : 0;
    return (4 * sq(curvature) + sq(from.distance(to))) / (8 * curvature);
}

/** shorthand for drawing a rectangle in d3 */
export function rect(selection: AnySelection, rectConfig: RectConfig): Selection<SVGRectElement, any, any, any> {

    const {
        bounds,
        width,
        height,
        fill,
        stroke,
        strokeWidth,
        rx
    } = rectConfig;

    const {topLeft} = bounds;

    return selection.append<SVGRectElement>(SVGTags.SVGRectElement)
        .attr(SVGAttrs.x, topLeft.x)
        .attr(SVGAttrs.y, topLeft.y)
        .attr(SVGAttrs.width, width)
        .attr(SVGAttrs.height, height)
        .attr(SVGAttrs.fill, fill)
        .attr(SVGAttrs.stroke, stroke)
        .attr(SVGAttrs.strokeWidth, strokeWidth)
        .attr(SVGAttrs.rx, rx);

}

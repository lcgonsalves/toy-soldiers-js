import {IGraphEdge, IGraphNode} from "ts-shared/build/lib/graph/GraphInterfaces";
import {ICoordinate} from "ts-shared/build/lib/geometry/Coordinate";
import {sq} from "ts-shared/build/lib/util/Shorthands";
import {Selection} from "d3-selection";
import SVGTags from "./SVGTags";
import SVGAttrs from "./SVGAttrs";


export type AnySelection = Selection<any, any, any, any>;

export class RectConfig {
    topLeft: ICoordinate;
    width: number;
    height: number;
    cls: string;
    fill: string = "white";
    stroke: string = "black";
    strokeWidth: number = 0.4;
    rx: number = 0.2;


    constructor(topLeft: ICoordinate, width: number, height: number, cls: string = "") {
        this.topLeft = topLeft;
        this.width = width;
        this.height = height;
        this.cls = cls;
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
export function rect(selection: AnySelection, rectConfig: RectConfig): AnySelection {

    const {
        topLeft,
        width,
        height,
        fill,
        stroke,
        strokeWidth,
        rx
    } = rectConfig;

    return selection.append(SVGTags.SVGRectElement)
        .attr(SVGAttrs.x, topLeft.x)
        .attr(SVGAttrs.y, topLeft.y)
        .attr(SVGAttrs.width, width)
        .attr(SVGAttrs.height, height)
        .attr(SVGAttrs.fill, fill)
        .attr(SVGAttrs.stroke, stroke)
        .attr(SVGAttrs.strokeWidth, strokeWidth)
        .attr(SVGAttrs.rx, rx);

}

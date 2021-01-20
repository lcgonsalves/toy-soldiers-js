import {IGraphEdge, IGraphNode} from "ts-shared/build/lib/graph/GraphInterfaces";
import {ICoordinate} from "ts-shared/build/lib/geometry/Coordinate";
import {sq} from "ts-shared/build/lib/util/Shorthands";
import {Selection} from "d3-selection";

export type AnySelection = Selection<any, any, any, any>;

abstract class DrawHelpers {

    /** Returns coordinate of point (x1,y1) as defined in the usage of d3.path().arcTo() from a given curvature degree parameter */
    public static getArcToTangentPoint(edge: IGraphEdge<IGraphNode, IGraphNode>, intersectingNode?: IGraphNode, bufferRadius: number = 0): ICoordinate {

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

    /** returns radius needed for a when given an intersecting node */
    public static getCurveRadius(edge: IGraphEdge<IGraphNode, IGraphNode>, intersectingNode?: IGraphNode, bufferRadius: number = 0): number {
        const {from, to} = edge;
        const midpoint = from.midpoint(to);
        const curvature = intersectingNode ? intersectingNode.radius + bufferRadius : 0;
        return (4 * sq(curvature) + sq(from.distance(to))) / (8 * curvature);
    }

}

export default DrawHelpers;


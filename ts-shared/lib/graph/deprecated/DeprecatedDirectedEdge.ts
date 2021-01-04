import IComparable from "../../util/IComparable";
import {ICoordinate} from "../../geometry/Coordinate";
import DeprecatedNode from "./DeprecatedNode";
import Vector from "../../util/Vector";
import {ILine, Line} from "../../geometry/Line";
import {sq} from "../../util/Shorthands";

/** Encodes a connection between a source and a destination */
export default class DeprecatedDirectedEdge implements ILine {
    private readonly _from: DeprecatedNode;
    private readonly _to: DeprecatedNode;
    get to(): DeprecatedNode { return this._to; }
    get from(): DeprecatedNode { return this._from; }
    get id(): string { return `${this.from.id}->${this.to.id}` }
    get toVector(): Vector { return this.from.vectorTo(this.to); }
    get toLine(): Line { return Line.from(this.from, this.to); }
    get midpoint(): ICoordinate { return this.from.midpoint(this.to); }
    get size(): number { return this.toVector.length(); }

    constructor(from: DeprecatedNode, to: DeprecatedNode) {
        this._from = from;
        this._to = to;
    }

    public toString(): string {
        return `${this._from.toString()} -> ${this._to.toString()}`
    }

    equals(other: IComparable): boolean {
        return other instanceof DeprecatedDirectedEdge && this._to.equals(other._to) && this._from.equals(other._from);
    }

    /** Returns coordinate of point (x1,y1) as defined in the usage of d3.path().arcTo() from a given curvature degree parameter */
    getArcToTangentPoint(intersectingNode?: DeprecatedNode): ICoordinate {
        const {from, to} = this;
        const midpoint = from.midpoint(to);
        const curvature = intersectingNode ? intersectingNode.radius + intersectingNode.bufferRadius : 0;

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
    getCurveRadius(intersectingNode?: DeprecatedNode): number {
        const {from, to} = this;
        const midpoint = from.midpoint(to);
        const curvature = intersectingNode ? intersectingNode.radius + intersectingNode.bufferRadius : 0;
        return (4 * sq(curvature) + sq(from.distance(to))) / (8 * curvature);
    }

    shortestDistanceBetween(point: ICoordinate): number {
        return Line.from(this.from, this.to).shortestDistanceBetween(point);
    }

    /** determines if a given Node is collinear (intersects, collides) with a straight line between
     * the nodes of this edge */
    intersects(node: DeprecatedNode): boolean {
        const distanceToEdge = this.shortestDistanceBetween(node);
        const distanceToA = this.from.distance(node);
        const distanceToB = this.to.distance(node);

        const intersectsLine = distanceToEdge <= node.radius + node.bufferRadius;

        return intersectsLine && !(distanceToA > this.size || distanceToB > this.size);
    }
}
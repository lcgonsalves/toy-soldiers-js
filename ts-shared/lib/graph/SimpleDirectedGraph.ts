import Domain from "../geometry/Domain";
import {Interval} from "../geometry/Interval";
import {ICoordinate} from "../geometry/Coordinate";
import IComparable from "../util/IComparable";
import {IGraph, IGraphNode} from "./GraphInterfaces";
import EMap from "../util/EMap";
import {Line} from "../geometry/Line";
import {Observable, Subject, Subscription} from "rxjs";

export default class SimpleDirectedGraph<Node extends IGraphNode> implements IGraph<Node> {

    readonly domain: Domain;
    readonly nodes: EMap<string, Node> = new EMap<string, Node>();
    readonly width: number;
    readonly height: number;
    get step(): number { return this.domain.x.step }

    private _$add: Subject<Node[]> = new Subject<Node[]>();
    private _$rm: Subject<Node[]> = new Subject<Node[]>();

    get $add(): Observable<Node[]> {
        return this._$add;
    }

    get $rm(): Subject<Node[]> {
        return this._$rm;
    }

    constructor(step?: number, width: number = 200, height: number = 200) {

        const s = step ? step : 1;

        this.domain = new Domain(new Interval(- (width / 2), (width / 2), s), new Interval(- (height / 2), (height / 2), s));

        this.height = height;
        this.width = width;

    }

    // shorthand for converting it to an array
    public all(): Node[] {
        return [ ...this.nodes.values() ];
    }

    add(...n: Node[]): IGraph<Node> {
        n.forEach(n => this.nodes.setValue(n.id, n));
        this._$add.next(n);
        return this;
    }

    onAdd(observer: (node: Node[]) => void): Subscription {
        return this.$add.subscribe(observer);
    }

    rm(...n: string[]): IGraph<Node> {
        const nrm = n.flatMap(nodeID => this.nodes.remove(nodeID));
        this._$rm.next(nrm);
        return this;
    }

    onRm(observer: (node: Node[]) => void): Subscription {
        return this.$rm.subscribe(observer);
    }

    contains(id: string): boolean {
        return !!this.nodes.getValue(id);
    }

    containsNodeAtLocation(location: ICoordinate): boolean {

        for (let node of this.all()) {
            if (node.distance(location) === 0)
                return true;
        }

        return false;
    }

    containsNodesInVicinity(center: ICoordinate, radius: number): boolean {

        for (let node of this.nodes.values()) {
            if (node.distance(center) <= radius) return true;
        }

        return false;
    }

    equals(other: IComparable): boolean {

        if (other instanceof SimpleDirectedGraph) {

            const array = this.all();
            for (let i = 0; i < array.length; i++) {
                if (!this.contains(array[i].id)) return false;
            }


        }

        return true;

    }

    get(id: string): Node | undefined {
        return this.nodes.getValue(id);
    }

    getNodesAtPosition(location: ICoordinate): Node[] {
        const out = [];
        this.all().forEach((node, _) => {
            if (node.distance(location) === 0) out.push(node);
        });
        return out;
    }

    getNodeAtPosition(location: ICoordinate): Node | undefined {
        for (let node of this.nodes.values()) if (node.distance(location) === 0) return node;
        return undefined;
    }

    getNodesInVicinity(center: ICoordinate, radius: number): Node[] {
        return this.all().filter((n): boolean => n.distance(center) <= radius);
    }

    getNodesIntersecting(from: IGraphNode, to: IGraphNode): Node[] {

        const bufferRadius = 2;

        let intersects = this.all().filter(n => {

            const isNotFromNode = !n.equals(from);
            const isNotToNode = !n.equals(to);

            const distanceToEdge = Line.from(from, to).shortestDistanceBetween(n);
            const distanceToA = from.distance(n);
            const distanceToB = to.distance(n);

            const radius = bufferRadius? bufferRadius : 0;
            const intersectsLine = distanceToEdge <= n.radius + radius;

            const dist = from.distance(to);

            const aIsOutside = distanceToA > dist;
            const bIsOutside = distanceToB > dist;

            const intersectsNode = intersectsLine && !(aIsOutside || bIsOutside);

            return isNotFromNode &&
                isNotToNode &&
                intersectsNode
        });

        return intersects;
    }

    getNodesAdjacentTo(node: IGraphNode): Node[] {

        return this.all().filter(nodeInGraph => nodeInGraph.isAdjacent(node));

    }

    getOrElse<T>(id: string, fallbackValue: T): Node | T {
        const node: Node = this.nodes.getValue(id);
        return !!node ? node : fallbackValue;
    }

    replace(n: Node, reconnect?: boolean): IGraph<Node> {
        const prevNode: Node | undefined = this.nodes.getValue(n.id);
        if (reconnect && prevNode) {
            prevNode.adjacent.forEach(adjacentNode => {
                // connect to new, if connection exists back
                if (adjacentNode.isAdjacent(prevNode)) adjacentNode.connectTo(n);
                // disconnect from old either way
                adjacentNode.disconnectFrom(prevNode);
            });

        }

        // replace
        this.nodes.setValue(n.id, n);
        return this;
    }

}



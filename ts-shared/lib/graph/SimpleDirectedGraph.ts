import Domain from "../geometry/Domain";
import {Interval} from "../geometry/Interval";
import {ICoordinate} from "../geometry/Coordinate";
import IComparable from "../util/IComparable";
import {IGraph, IGraphEdge, IGraphNode} from "./GraphInterfaces";
import {Edge} from "./SimpleDirectedEdge";

export default class SimpleDirectedGraph<Node extends IGraphNode> implements IGraph<Node> {
    readonly domain: Domain;
    readonly nodes: Map<string, Node> = new Map<string, Node>();

    constructor(step?: number) {

        const s = step ? step : 1;

        this.domain = new Domain(new Interval(-100, 100, s), new Interval(-100, 100, s))

    }

    // shorthand for converting it to an array
    public nodeArr(): Node[] {
        return [ ...this.nodes.values() ];
    }

    add(...n: Node[]): IGraph<Node> {
        n.forEach(n => this.nodes.set(n.id, n));
        return this;
    }

    rm(...n: string[]): IGraph<Node> {
        n.forEach(nodeID => this.nodes.delete(nodeID));
        return this;
    }

    contains(id: string): boolean {
        return !!this.nodes.get(id);
    }

    containsNodeAtLocation(location: ICoordinate): boolean {

        for (let node of this.nodeArr()) {
            if (node.distance(location) === 0) return true;
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

            const array = this.nodeArr();
            for (let i = 0; i < array.length; i++) {
                if (!this.contains(array[i].id)) return false;
            }


        }

        return true;

    }


    get(id: string): Node | undefined {
        return this.nodes.get(id);
    }

    getNodesAtPosition(location: ICoordinate): Node[] {
        const out = [];
        this.nodeArr().forEach((node, _) => {
            if (node.distance(location) === 0) out.push(node);
        });
        return out;
    }

    getNodesInVicinity(center: ICoordinate, radius: number): Node[] {
        return this.nodeArr().filter((n): boolean => n.distance(center) <= radius);
    }

    getNodesIntersecting(e: IGraphEdge<IGraphNode, IGraphNode>): Node[] {
        const {from, to} = e;
        return this.nodeArr().filter(n => {
            const isNotFromNode = !n.equals(from);
            const isNotToNode = !n.equals(to);

            return isNotFromNode &&
            isNotToNode &&
            e.intersects(n)
        });
    }

    getOrElse<T>(id: string, fallbackValue: T): Node | T {
        const node: Node = this.nodes.get(id);
        return !!node ? node : fallbackValue;
    }

    replace(n: Node, reconnect?: boolean): IGraph<Node> {
        const prevNode: Node | undefined = this.nodes.get(n.id);
        if (reconnect && prevNode) {
            prevNode.adjacent.forEach(adjacentNode => {
                // connect to new, if connection exists back
                if (adjacentNode.isAdjacent(prevNode)) adjacentNode.connectTo(n);
                // disconnect from old either way
                adjacentNode.disconnectFrom(prevNode);
            });

        }

        // replace
        this.nodes.set(n.id, n);
        return this;
    }

}
import React, {Component} from 'react';
import {select} from "d3-selection";
import {path} from "d3-path";
import {scaleLinear} from "d3-scale";
import {extent} from "d3-array";
import * as d3 from "d3";


// todo: move state to props
interface GameMainProps {

}

interface IComparable {
    /**
     * Returns true if objects are functionally equal.
     * @param other
     */
    equals(other: IComparable): boolean;
}

class Coordinate {
    readonly x: number;
    readonly y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    /**
     * Returns the midpoint between two coordinates.
     * @param other
     */
    midpoint(other: Coordinate): Coordinate {
        return new Coordinate((this.x + other.x) / 2, (this.y + other.y) / 2);
    }

    /**
     * Returns the distance between two coordinates.
     * @param other
     */
    distance(other: Coordinate): number {

        return Math.sqrt(
          Math.pow(this.x - other.x, 2) +
          Math.pow(this.y - other.y, 2)
        )

    }

}

class DirectedEdge implements IComparable {
    get to(): Node {
        return this._to;
    }
    get from(): Node {
        return this._from;
    }

    private readonly _from: Node;
    private readonly _to: Node;

    constructor(from: Node, to: Node) {
        this._from = from;
        this._to = to;
    }

    public toString(): string {
        return `${this._from.toString()} -> ${this._to.toString()}`
    }

    equals(other: DirectedEdge): boolean {
        return this._to.equals(other._to) && this._from.equals(other._from);
    }
}

class Node implements IComparable {
    private readonly _coordinate: Coordinate;
    private readonly _id: string;
    private edges: DirectedEdge[];

    get y(): number { return this._coordinate.y; }
    get x(): number { return this._coordinate.x; }
    get id(): string { return this._id; }

    constructor(id: string, x: number, y: number, edges: DirectedEdge[] = []) {
        this._id = id;
        this._coordinate = new Coordinate(x, y);
        this.edges = edges;
    }

    /** returns midpoint between two nodes */
    public midpoint(other: Node): Coordinate {
        return this._coordinate.midpoint(other._coordinate);
    }

    /** returns distance between two nodes */
    public distance(other: Node): number {
        return this._coordinate.distance(other._coordinate);
    }

    /** Converts the node and its immediate connections to a string */
    public toStringComplex(): string {
        const destinations = this.edges.map(e => e.to.toStringSimple());

        if (this.edges.length === 0 || destinations.length === 0) return `(${this.x}, ${this.y})`;

        return `[${this._id}](${this.x}, ${this.y}) -> ${destinations.reduce((acc, cur) => acc + ", " + cur)}`;
    }

    /** Converts the node to a simple string with no edges */
    public toStringSimple(): string {
        return `[${this._id}](${this.x}, ${this.y})`
    }

    /** Returns true if the node has the same coordinates. */
    equals(other: Node): boolean {
        return this._id === other._id;
    }

    /** Updates edges of this node to be the same as a template. Template must pass _.equals() validation */
    public updateEdges(template: Node): Node {
        if (!template.equals(this))
            throw new Error("Cannot update edges from a different Node! Nodes must .equals() each other.");

        // TODO: do I need to verify if edges.from() all match this??
        this.edges = template.edges;

        return this;
    }

    /**
     * Returns true if other node is directly accessible from this node.
     * O(edges.length)
     *
     */
    isAdjacent(other: Node): boolean {
        return !!this.edges.find(edge => edge.to.equals(other));
    }

    /** Gets all the nodes immediately adjacent to this. */
    getAdjacent(): Node[] {
        return this.edges.map(edge => edge.to);
    }

    /**
     * Connects this node to other node.
     *
     * @param {Node} other target node
     * @param {boolean} bidirectional optional – whether the connection should work both ways
     * @returns {Node} this node (for chaining connections)
     */
    connectTo(other: Node, bidirectional: boolean = false): Node {
        if (bidirectional) other.connectTo(this);
        if (!this.isAdjacent(other)) {
            this.edges.push(new DirectedEdge(this, other));
        }

        return this;
    }

}

// TODO: node removal?
class DirectedGraph implements IComparable {
    private _nodes: Node[];
    public readonly domain: [number, number] = [0, 3];

    constructor(...nodes: Node[]) {
        this._nodes = [...nodes];
    }

    get nodes(): Node[] { return this._nodes }

    public toString(): string {
        return this._nodes.map(n => n.toString()).reduce( (acc, cur) => acc + "\n" + cur );
    }

    /**
     * Returns true if graph contains a given node.
     *
     * @param n
     */
    public contains(n: Node): boolean {
        return !!this._nodes.find(_ => _.equals(n));
    }

    /**
     * Returns given node if it exists in the graph. If node doesn't
     * exist, an error is thrown.
     *
     * @param n
     */
    public get(n: Node): Node {
        const outputNode = this._nodes.find(_ => _.equals(n));
        if (!outputNode) throw new Error("Cannot get node that is not part of the graph.");
        else return outputNode;
    }

    /**
     * Returns given node if it exists in the graph. If node doesn't
     * exist, else is returned.
     *
     * @param n
     * @param fallbackValue
     */
    public getOrElse(n: Node, fallbackValue: any): Node | any {
        if (!this.contains(n)) return fallbackValue;
        else return this.get(n);
    }

    /**
     * Adds node(s) to the graph if not yet contained. If a node is already contained,
     * this function updates the edges of that node to the new one.
     *
     * @param n
     */
    public addNode(...n: Node[]): DirectedGraph {
        n.forEach(node => !this.contains(node) ? this._nodes.push(node) : this.findAndUpdateEdges(node));
        return this;
    }

    /**
     * For a given node n, if it is already contained by the graph, update its edges.
     * Otherwise, add it to the graph.
     *
     * @param n the node
     */
    private findAndUpdateEdges(n: Node): Node {
        return this.get(n).updateEdges(n);
    }

    /**
     * Adds a pair of nodes to the graph and connects them. If either of the nodes already
     * exists, it will be connected to the other. If both already exist, they will be connected to each other.
     *
     * @param {Node} n1 Starting node if unidirectional
     * @param {Node} n2 Ending node if unidirectional
     * @param {boolean} bidirectional false if unidirectional
     * @returns {Node} the second node, or ending node if unidirectional
     */
    public addAndConnect(n1: Node, n2: Node, bidirectional: boolean = false): DirectedGraph {
        // TODO: rethink node addition
        if (
          n1.x > this.domain[1] ||
          n1.x < this.domain[0] ||
          n1.y > this.domain[1] ||
          n1.y < this.domain[0] ||
          n2.x > this.domain[1] ||
          n2.x < this.domain[0] ||
          n2.y > this.domain[1] ||
          n2.y < this.domain[0]
        ) throw new Error("Nodes do not fit in the coordinate system!");

        let firstNode: Node, secondNode: Node;

        firstNode = this.getOrElse(n1, n1);
        secondNode = this.getOrElse(n2, n2);

        firstNode.connectTo(secondNode, bidirectional);

        // adds if they don't exist yet
        return this.addNode(firstNode, secondNode);
    }

    equals(other: DirectedGraph): boolean {
        return this._nodes.every(other.contains);
    }

}

interface GameMainState {
    g: DirectedGraph,
    r: number
}

// type shorthand for ease of reading
type SVGElement = React.RefObject<SVGSVGElement>;

class GameMain extends Component<any, GameMainState> {
    state: GameMainState;
    private svgElement: SVGElement = React.createRef();

    constructor(props: any) {
        super(props);

        // init nodes
        let p1, p2, p3, p4, p5;
        p1 = new Node("P1", 0, 0);
        p2 = new Node("P2", 0, 2);
        p3 = new Node("P3", 1, 1);
        p4 = new Node("P4", 2, 0);
        p5 = new Node("P5", 2, 2);

        const g = new DirectedGraph()
          .addAndConnect(p1, p2)
          // .addAndConnect(p1, p4)
          // .addAndConnect(p4, p5, true)
          // .addAndConnect(p2, p5, true)
          // .addAndConnect(p5, p3)
          // .addAndConnect(p3, p1);

        this.state = {g: g, r: 0};

        console.log(this.state.g.toString());
    }

    /** Once HTML elements have loaded, this method is run to initialize the SVG elements using D3. */
    private initializeGraph(): void {
        const svg = this.svgElement.current;
        const nodes = this.state.g.nodes;
        const mainGroup = select(svg).append("g").attr("id", "main");

        console.log(extent(nodes, n => n.x));

        // @ts-ignore
        const scaleX = x => {
            const output = scaleLinear().domain(this.state.g.domain).range([20, 80])(x);
            if (output) return output;
            else throw new Error("Could not scale variable X");
        };
        // @ts-ignore
        const scaleY = y => {
            const output = scaleLinear().domain(this.state.g.domain).range([20, 80])(y);
            if (output) return output;
            else throw new Error("Could not scale variable X");
        };

        const scaleBoth = (valueX: number, valueY: number): number[] => [scaleX(valueX), scaleY(valueY)];

        const graphNodes = mainGroup.append("g")
          .attr("id", "nodes")
          .selectAll("directed-graph-node")
          .data(this.state.g.nodes)
          .enter()
          .append("g")
          .attr("id", node => node.toStringSimple());

        const calculateRadius = (a: Coordinate, b: Coordinate): number => {
            return a.distance(b);
        }

        const drawEdgesOfNode = (node: Node, context: d3.Path): d3.Path => {
            node.getAdjacent().forEach( adjacentNode => {
                const midpoint = node.midpoint(adjacentNode);


                const [x0, y0] = scaleBoth(node.x, node.y);
                const [x1, y1] = scaleBoth(midpoint.x, midpoint.y);
                const [x2, y2] = scaleBoth(adjacentNode.x, adjacentNode.y);
                const minumumRadius = calculateRadius(
                  new Coordinate(x0, y0),
                  new Coordinate(x1, y1)
                ) * 1.5;

                context.moveTo(x0, y0);
                context.arcTo(x1, y1, x2, y2, minumumRadius);
            });

            return context;
        };

        console.log(drawEdgesOfNode(this.state.g.nodes[0], path()));

        // @ts-ignore
        graphNodes.append("path")
          .attr("stroke", "red")
          .attr("d", node => drawEdgesOfNode(node, path()));

        graphNodes.append("circle")
          .attr("stroke", "steelblue")
          .attr("cx", node => scaleX(node.x))
          .attr("cy", node => scaleY(node.y))
          .attr("r", 5);

        // graphNodes.append("text")
        //   .attr("id", "node-text")
        //   .attr("x", node => scaleX(node.x))
        //   .attr("y", node => scaleX(node.y))
        //   .attr("font-size", 3)
        //   .text(node => node.toStringSimple())
    }

    private updateGraph(): void {
        const svg = this.svgElement.current;
        const mainGroup = select(svg).selectAll("directed-graph-node");

        console.log(mainGroup);
    }

    componentDidMount(): void {
        this.initializeGraph();
    }

    componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<GameMainState>, snapshot?: any): void {
        this.updateGraph();
    }

    public render() {

        return (
          <div>
              <svg
                ref={this.svgElement}
                height="100vh"
                width="100vw"
                viewBox={`0 0 100 100`}
              />
              <input type="range" min={0} max={100} step={1} value={this.state.r} onChange={evt => this.setState({r: parseInt(evt.target.value)})}/>
              <p>{this.state.r}</p>
          </div>
        );
    }
}


export default GameMain;
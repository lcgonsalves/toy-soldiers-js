import React, {Component} from 'react';
import {select, pointer, Selection, BaseType} from "d3-selection";
import {path, Path} from "d3-path";
import {drag, DragBehavior, DraggedElementBaseType, SubjectPosition} from "d3-drag";
import Node from "ts-shared/build/graph/Node";
import DirectedGraph from "ts-shared/build/graph/DirectedGraph";
import DirectedEdge from "ts-shared/build/graph/DirectedEdge";
import "../../css/DirectedGraph.css";
import Coordinate from "ts-shared/build/geometry/Coordinate";

// todo: move state to props
interface GameMainProps {

}
interface GameMainState {
    nodes: Node[],
    pathCurveDegree: number
}

// type shorthand for ease of reading
type SVGElement = React.RefObject<SVGSVGElement>;

class GameMain extends Component<any, GameMainState> {
    state: GameMainState;
    private graph: DirectedGraph = new DirectedGraph();
    private svgElement: SVGElement = React.createRef();
    private nodeElements: Selection<SVGCircleElement, Node, SVGGElement, unknown> | undefined;
    private edgeElements: Selection<SVGPathElement, DirectedEdge, SVGGElement, unknown> | undefined;

    constructor(props: any) {
        super(props);

        // init nodes
        let p1, p2, p3, p4, p5;
        p1 = new Node("P1", 40, 30);
        p2 = new Node("P2", 30, 10);
        p3 = new Node("P3", 50, 35);
        p4 = new Node("P4", 60, 70);
        p5 = new Node("P5", 87, 67);

        this.graph.isSnappingNodesToGrid = true;
        this.graph.addAndConnect(p1, p4)
          // .addAndConnect(p1, p4)
          // .addAndConnect(p4, p5, true)
          // .addAndConnect(p2, p5, true)
          // .addAndConnect(p5, p3)
          // .addAndConnect(p3, p1);

        this.state = {nodes: this.graph.nodes, pathCurveDegree: 10};

    }

    /** Once HTML elements have loaded, this method is run to initialize the SVG elements using D3. */
    private initializeGraph(): void {
        const drawGrid = (context: Path): Path => {
            const xDomain = this.graph.domain.x,
                yDomain = this.graph.domain.y;

            for (let col = xDomain.min; xDomain.contains(col); col += this.graph.step) {
                context.moveTo(col, yDomain.min);
                context.lineTo(col, yDomain.max);
            }

            for (let row = yDomain.min; yDomain.contains(row); row += this.graph.step) {
                context.moveTo(xDomain.min, row);
                context.lineTo(xDomain.max, row);
            }

            return context;
        }

        const mainGroup = select(this.svgElement.current)
            .append("g")
            .attr("id", "main");

        // draw grid
        mainGroup.append("path")
            .classed("grid", true)
            .attr("d", drawGrid(path()).toString());

        // append nodes svg group
        mainGroup.append("g")
            .attr("id", "nodes");

        // append edges svg group
        mainGroup.append("g")
            .attr("id", "edges");

    }

    /** Generates a drag function for a given element, with all handlers assigned */
    private initDragHandlers<E extends DraggedElementBaseType, N extends Node>(): DragBehavior<E, N, SubjectPosition | N> {
        const updateNodeArray = () => this.setState({nodes: this.graph.nodes});

        // sets node to active
        function onStart(this: E, evt: any, dataPoint: N) {
            select(this).classed("dragging", true);
        }

        // changes the element's location
        function onDrag(this: E, evt: any, dataPoint: N) {
            const {x, y} = DirectedGraph.snapToGrid(evt.x, evt.y)

            select(this)
                .selectAll("circle")
                .attr("cx", x)
                .attr("cy", y);

            select(this)
                .selectAll("text")
                .attr("x", x + dataPoint.weight + 1)
                .attr("y", y);

        }

        // deactivates node, updates real value
        function onEnd(this: E, evt: any, coordinate: N) {
            const {x, y} = DirectedGraph.snapToGrid(evt.x, evt.y)

            select(this).classed("dragging", false);
            coordinate.moveTo(x, y);
            updateNodeArray();
        }

        return drag<E, N>()
            .on("start", onStart)
            .on("drag", onDrag)
            .on("end", onEnd);
    }

    /** draws a line connecting two nodes given an edge */
    private drawEdge(edge: DirectedEdge, context: Path, curved?: boolean): Path {
        const drawStraightEdge = (edge: DirectedEdge, context: Path): Path => {
            const {from, to} = edge;

            context.moveTo(from.x, from.y);
            context.lineTo(to.x, to.y);

            return context;
        };
        const drawCurvedEdge = (edge: DirectedEdge, context: Path): Path => {
            const {from, to} = edge;
            const p0 = new Coordinate(from.x, from.y),
                p2 = new Coordinate(to.x, to.y);

            const degree = this.state.pathCurveDegree; // = 10
            const midpoint = p0.midpoint(p2); // coordinate of midpoint
            const perpendicularVectorMTo = p2.perpedicularVector(midpoint); // "perpendicular" vector from midpoint to p2
            const radius = Math.sqrt(
                Math.pow(degree, 2) +
                Math.pow(midpoint.vector(p2).length(), 2)
            ); // pitágoras for radius square root of (10^2) + (magnitude of vector)^2
            const ratio = perpendicularVectorMTo.length() / degree;
            const finalVector = vectorToCoordinate(perpendicularVectorMTo.scale(ratio).add(perpendicularVectorMTo)); // scale vector
            const tangentPoint =
                new Coordinate(finalVector.x + p2.x, finalVector.y + p2.y) // result

            console.log(midpoint);
            console.log(tangentPoint)

            // TODO: rm debug -- draw line from midpoint to tan
            context.moveTo(midpoint.x, midpoint.y);
            context.lineTo(tangentPoint.x, tangentPoint.y);

            context.moveTo(p0.x, p0.y);
            context.arcTo(tangentPoint.x, tangentPoint.y, p2.x, p2.y, radius);
            context.lineTo(p2.x, p2.y);
            return context;
        };

        drawStraightEdge(edge, context);
        if (curved) return drawCurvedEdge(edge, context);
        else return drawStraightEdge(edge, context);
    }

    /** re-evaluates data and renders graph */
    private updateGraph(): void {

        const graphEdgeContainer = this.renderEdges();

        this.renderNodes();

        // TODO: remove debug parameter
        const graphEdgeDEBUG = graphEdgeContainer
            .selectAll<SVGPathElement, Node>("circle")
            .data<DirectedEdge>(this.state.nodes.flatMap(_ => _.edges), _ => _.id);

        // add midpoint for debug
        graphEdgeDEBUG.enter().append("circle")
            .attr("stroke", "red")
            .attr("cx", edge => edge.from.midpoint(edge.to).x)
            .attr("cy", edge => edge.from.midpoint(edge.to).y)
            .attr("r", 0.5);

        graphEdgeDEBUG.exit().remove();

        graphEdgeDEBUG
            .attr("cx", edge => edge.from.midpoint(edge.to).x)
            .attr("cy", edge => edge.from.midpoint(edge.to).y);

    }

    /** renders edges contained by each node */
    private renderEdges() {
        const graphEdgeContainer = select(this.svgElement.current)
            .select("#edges");

        const graphEdges = graphEdgeContainer
            .selectAll<SVGPathElement, Node>("path")
            .data<DirectedEdge>(this.state.nodes.flatMap(_ => _.edges), _ => _.id);

        // add new edges
        const edgeGroupOnEnter = graphEdges.enter()
            .append("g")
            .attr("class", ".directed-graph-edge");

        // remove old unused edges
        graphEdges.exit().remove();

        // update path of unchanged edges
        graphEdges.attr("d", edge => this.drawEdge(edge, path(), true).toString())

        // draw new edges
        edgeGroupOnEnter.append("path")
            .classed("edge", true)
            .attr("d", edge => this.drawEdge(edge, path(), true).toString());

        return graphEdgeContainer;
    }

    /** renders nodes in state */
    private renderNodes() {
        // select nodes
        const graphNodes = select(this.svgElement.current)
            .select("#nodes")
            .selectAll<SVGCircleElement, Node>("g")
            .data<Node>(this.state.nodes, _ => _.id);

        // update nodes with their current position
        graphNodes.selectAll<SVGCircleElement, Node>("circle")
            .attr("cx", node => node.x)
            .attr("cy", node => node.y);

        graphNodes.selectAll<SVGTextElement, Node>("text")
            .attr("x", node => node.x + node.weight + 1)
            .attr("y", node => node.y)

        // add newly added nodes if any
        const nodeG = graphNodes.enter()
            .append("g")
            .classed("node_container", true)
            .call(this.initDragHandlers<SVGGElement, Node>());

        nodeG.append("circle")
            .classed("node", true)
            .attr("cx", node => node.x)
            .attr("cy", node => node.y)
            .attr("r", node => node.weight);

        nodeG.append("text")
            .classed("node_label", true)
            .attr("x", node => node.x + node.weight + 1)
            .attr("y", node => node.y)
            .text(node => node.id);

        // remove nodes that don't exist anymore
        graphNodes.exit().remove();
    }

    componentDidMount(): void {
        this.initializeGraph();
        this.updateGraph();
    }

    componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<GameMainState>, snapshot?: any): void {
        this.updateGraph();
    }

    public render() {

        return (
          <div>
              <svg
                ref={this.svgElement}
                height="90vh"
                width="90vw"
                viewBox={`-10 -10 110 110`}
              />
              <input type="range" min={0} max={100} step={1} value={this.state.pathCurveDegree} onChange={evt => this.setState({pathCurveDegree: parseInt(evt.target.value)})}/>
              <p>{this.state.pathCurveDegree}</p>
          </div>
        );
    }
}


export default GameMain;
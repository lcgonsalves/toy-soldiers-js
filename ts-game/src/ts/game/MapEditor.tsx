import React, {Component} from 'react';
import {select} from "d3-selection";
import {path, Path} from "d3-path";
import {drag, DragBehavior, DraggedElementBaseType, SubjectPosition} from "d3-drag";
import Node from "ts-shared/build/graph/Node";
import DirectedGraph from "ts-shared/build/graph/DirectedGraph";
import DirectedEdge from "ts-shared/build/graph/DirectedEdge";
import "../../css/DirectedGraph.css";
import "../../css/Editor.css"
import {Coordinate, ICoordinate} from "ts-shared/build/geometry/Coordinate";
import Tooltip from "../ui/Tooltip";
import {Interval} from "ts-shared/build/geometry/Interval";
import {zoom, ZoomBehavior, ZoomedElementBaseType, zoomTransform} from "d3-zoom";
import d3 from 'd3';

// todo: move state to props
interface GameMainProps {

}

interface GameMainState {
    nodes: Node[],
    displayTooltip: boolean,
    tooltipLocation: ICoordinate,
    cursorLocation: ICoordinate | undefined
}

// type shorthand for ease of reading
type ReactSVGRef = React.RefObject<SVGSVGElement>;

class MapEditor extends Component<GameMainProps, GameMainState> {
    state: GameMainState;
    private graph: DirectedGraph = new DirectedGraph();
    private svgElement: ReactSVGRef = React.createRef();
    public static readonly cssClass: string = "map-editor";

    constructor(props: any) {
        super(props);

        // init nodes
        let p1, p2, p3, p4, p5;
        p1 = new Node("P1", 20, 40);
        p2 = new Node("P2", 40, 60);
        p3 = new Node("P3", 30, 50);
        p4 = new Node("P4", 40, 50);
        p5 = new Node("P5", 87, 67);

        this.graph.isSnappingNodesToGrid = true;
        this.graph.addAndConnect(p1, p2)
            .addAndConnect(p3, p2);
        // .addAndConnect(p1, p4)
        // .addAndConnect(p4, p5, true)
        // .addAndConnect(p2, p5, true)
        // .addAndConnect(p5, p3)
        // .addAndConnect(p3, p1);

        this.state = {
            nodes: this.graph.nodes,
            displayTooltip: false,
            tooltipLocation: new Coordinate(0, 0),
            cursorLocation: undefined
        };

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
        };
        const updateTooltipLocation = (x: number, y: number): void => this.setState({tooltipLocation: new Coordinate(x, y)});
        const updateCursorLocation = (x: number, y: number): void => this.setState({cursorLocation: new Coordinate(x, y)});

        const bgCoords = {
            topL: new Coordinate(this.graph.domain.x.min, this.graph.domain.y.min),
            topR: new Coordinate(this.graph.domain.x.max, this.graph.domain.y.min),
            bottomL: new Coordinate(this.graph.domain.x.min, this.graph.domain.y.max),
            bottomR: new Coordinate(this.graph.domain.x.max, this.graph.domain.y.max)
        };

        const mainGroup = select(this.svgElement.current)
            .append("g")
            .attr("id", "main")
            .call(this.initZoomHandlers<SVGGElement, any>(bgCoords, 20, zoomed))

        function zoomed(this: SVGGElement, event: any, d: any) {
            const transform = event.transform;
            console.log(event)
            mainGroup.attr("transform", transform.toString()) //  "translate(" + transform.x + "," + transform.y + ") scale(" + transform.k + ")");
        }


        // background for event tracking
        mainGroup.append("rect")
            .attr("x", bgCoords.topL.x)
            .attr("y", bgCoords.topL.y)
            .attr("width", bgCoords.topL.distance(bgCoords.topR))
            .attr("height", bgCoords.topL.distance(bgCoords.bottomL))
            .attr("fill", "#bcbcbc")

        // draw grid
        mainGroup.append("path")
            .classed("grid", true)
            .attr("d", drawGrid(path()).toString());

        // append edges svg group
        mainGroup.append("g")
            .attr("id", "edges");

        // append nodes svg group
        mainGroup.append("g")
            .attr("id", "nodes")
            .classed("node", true);

        // append add-node icon svg group
        mainGroup.append("g")
            .attr("id", "add-nodes");

    }


    /** Generates a drag function for a given element, with all handlers assigned */
    private initDragHandlers<E extends DraggedElementBaseType, N extends Node>(): DragBehavior<E, N, SubjectPosition | N> {
        const updateNodeArray = () => this.setState({nodes: this.graph.nodes});

        // sets node to active
        function onStart(this: E, evt: any, dataPoint: N) {
            select(this).classed("grabbed", true);
        }

        const step = this.graph.step;

        // changes the element's location
        function onDrag(this: E, evt: any, dataPoint: N) {
            let {x, y} = evt;

            const snapCore = DirectedGraph.snapToGrid(x, y);
            const fractionOfStep = step * 0.04;
            const snapZone = {
                x: new Interval(snapCore.x - fractionOfStep, snapCore.x + fractionOfStep),
                y: new Interval(snapCore.y - fractionOfStep, snapCore.y + fractionOfStep)
            };

            x = snapZone.x.contains(x) ? snapCore.x : x;
            y = snapZone.y.contains(y) ? snapCore.y : y;

            select(this)
                .selectAll("circle")
                .attr("cx", x)
                .attr("cy", y);

            select(this)
                .selectAll("text")
                .attr("x", x + dataPoint.radius + 1)
                .attr("y", y);

        }

        // deactivates node, updates real value
        function onEnd(this: E, evt: any, coordinate: N) {
            const {x, y} = DirectedGraph.snapToGrid(evt.x, evt.y)

            select(this).classed("grabbed", false);
            coordinate.moveTo(x, y);
            updateNodeArray();
        }

        return drag<E, N>()
            .on("start", onStart)
            .on("drag", onDrag)
            .on("end", onEnd);
    }

    /** initializes zoom function */
    private initZoomHandlers<E extends ZoomedElementBaseType, Data>(
        extent: {
            topL: ICoordinate,
            bottomR: ICoordinate
        },
        buffer: number = 25,
        handler: (this: E, event: any, d: Data) => void
    ): ZoomBehavior<E, Data> {
        function zoomed(this: E, event: any, d: Data) {
            const transform = event.transform;

            select("main")
                .attr("transform", transform) //  "translate(" + transform.x + "," + transform.y + ") scale(" + transform.k + ")");
        }

        return zoom<E, Data>()
            .scaleExtent([0.5, 2])
            .translateExtent([
                [extent.topL.x - buffer, extent.topL.y - buffer],
                [extent.bottomR.x + buffer, extent.bottomR.y + buffer]
            ])
            .on("zoom", zoomed);
    }

    /** draws a line connecting two nodes given an edge */
    private drawEdge(edge: DirectedEdge, context: Path, curved?: boolean): Path {
        const drawStraightEdge = (edge: DirectedEdge, context: Path): Path => {
            const {from, to} = edge;

            context.moveTo(from.x, from.y);
            context.lineTo(to.x, to.y);

            return context;
        };
        const drawCurvedEdge = (edge: DirectedEdge, context: Path, intersectingNode: Node): Path => {
            const tangentPoint = edge.getArcToTangentPoint(intersectingNode);
            context.moveTo(edge.from.x, edge.from.y);
            context.arcTo(tangentPoint.x, tangentPoint.y, edge.to.x, edge.to.y, edge.getCurveRadius(intersectingNode));
            context.lineTo(edge.to.x, edge.to.y);
            return context;
        };

        // todo: handle more than 1 inter
        const intersectingNode = this.graph.getNodesIntersectingWith(edge)[0];

        // drawStraightEdge(edge, context);
        if (intersectingNode) return drawCurvedEdge(edge, context, intersectingNode);
        else return drawStraightEdge(edge, context);
    }

    /** re-evaluates data and renders graph */
    private updateGraph(): void {

        this.renderEdges();
        this.renderNodes();

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
            .attr("x", node => node.x + node.radius + 1)
            .attr("y", node => node.y);

        // add newly added nodes if any
        const nodeG = graphNodes.enter()
            .append("g")
            .classed("node-container", true)
            .call(this.initDragHandlers<SVGGElement, Node>());

        nodeG.append("circle")
            .classed("node-circle", true)
            .attr("cx", node => node.x)
            .attr("cy", node => node.y)
            .attr("r", node => node.radius);

        nodeG.append("text")
            .classed("node-label", true)
            .attr("x", node => node.x + node.radius + 1)
            .attr("y", node => node.y)
            .text(node => node.id);

        // remove nodes that don't exist anymore
        graphNodes.exit().remove();
    }

    componentDidMount(): void {
        this.initializeGraph();
        this.updateGraph();
    }

    componentDidUpdate(prevProps: Readonly<GameMainProps>, prevState: Readonly<GameMainState>, snapshot?: any): void {
        this.updateGraph();
    }

    public render() {

        return (
            <div
                className={MapEditor.cssClass}
            >
                <Tooltip display={this.state.displayTooltip} position={this.state.tooltipLocation} cooldown={3000}/>
                <svg
                    ref={this.svgElement}
                    height="100vh"
                    width="100vw"
                    viewBox={`0 0 100 100`}
                />
            </div>
        );
    }

}


export default MapEditor;
import React, {Component} from 'react';


import "../../../css/DirectedGraph.css";
import "../../../css/Editor.css"

import {Selection, select} from "d3-selection";
import {path, Path} from "d3-path";
import Node from "ts-shared/build/graph/Node";
import DirectedGraph from "ts-shared/build/graph/DirectedGraph";
import DirectedEdge from "ts-shared/build/graph/DirectedEdge";
import {Coordinate, ICoordinate} from "ts-shared/build/geometry/Coordinate";
import Tooltip from "../../ui/Tooltip";
import {GameMapConfig, GameMapHelpers} from "./GameMapHelpers";
import LocationNodeUnit from "../units/LocationNodeUnit";

const {GraphZoomBehavior} = GameMapHelpers;

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

class GameMapEditor extends Component<GameMainProps, GameMainState> {
    state: GameMainState;
    private graph: DirectedGraph = new DirectedGraph();
    private svgElement: ReactSVGRef = React.createRef();
    private lnus: LocationNodeUnit<Node>[] = [];
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


        // defines extents of grid
        const gridCoords = {
            topL: new Coordinate(this.graph.domain.x.min, this.graph.domain.y.min),
            topR: new Coordinate(this.graph.domain.x.max, this.graph.domain.y.min),
            bottomL: new Coordinate(this.graph.domain.x.min, this.graph.domain.y.max),
            bottomR: new Coordinate(this.graph.domain.x.max, this.graph.domain.y.max)
        }

        // defines extents of background
        const bgCoords = {
            topL: new Coordinate(gridCoords.topL.x - 150, gridCoords.topL.y - 150),
            topR: new Coordinate(gridCoords.topR.x + 150, gridCoords.topR.y - 150),
            bottomL: new Coordinate(gridCoords.bottomL.x - 150, gridCoords.bottomL.y + 150),
            bottomR: new Coordinate(gridCoords.bottomR.x + 150, gridCoords.bottomR.y + 150)
        };


        // background for event tracking
        const backgroundElement = select(this.svgElement.current)
            .append("g")
            .attr("id", "background")
            .append("rect")
            .attr("x", bgCoords.topL.x)
            .attr("y", bgCoords.topL.y)
            .attr("width", bgCoords.topL.distance(bgCoords.topR))
            .attr("height", bgCoords.topL.distance(bgCoords.bottomL))
            .attr("fill", "#bcbcbc")


        const mainGroup = select(this.svgElement.current)
            .append("g")
            .attr("id", "main");

        backgroundElement.call(GraphZoomBehavior(bgCoords, mainGroup));

        // draw grid
        const gridGroup = mainGroup.append("g")
            .attr("id", "grid")
            .attr("pointer-events", "none");


        gridGroup.append("rect")
            .attr("x", gridCoords.topL.x)
            .attr("y", gridCoords.topL.y)
            .attr("height", gridCoords.topL.distance(gridCoords.bottomL))
            .attr("width", gridCoords.topL.distance(gridCoords.topR))
            .attr("fill", "#dedede");


        gridGroup.append("path")
            .classed("grid", true)
            .attr("d", drawGrid(path()).toString());

        // append edges svg group
        mainGroup.append("g")
            .attr("id", "edges");

        // append nodes svg group
        mainGroup.append("g")
            .attr("id", "nodes")
            .classed("node", true);


        // append menu
        const bottomMenu = select(this.svgElement.current)
            .append("g")
            .attr("id", "bottom-menu");
        this.initBottomMenu(bottomMenu);

    }

    /** Constructs and mounts bottom menu */
    private initBottomMenu(selection: Selection<any, unknown, null, undefined>): void {
        // todo: make generic for types and content of buttons

        // todo: add boxes
        // main container
        selection.append("rect")
            .attr("x", 5)
            .attr("y", 85)
            .attr("width", 90)
            .attr("height", 100 - 85 - 2)
            .attr("fill", "white")
            .attr("stroke", "black")
            .attr("stroke-width", "0.4")
            .attr("rx", "0.2")

        // todo: dragging within box will snap back to source location

        // todo: drag node from box transforms it to the appropriate size

        // todo: dropping node in graph adds it to graph, disconnected
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

    componentDidMount(): void {
        this.initializeGraph();

        const d3ReactAnchor = this.svgElement.current


        if (d3ReactAnchor) {
            const nodeContainer = select<SVGGElement, Node>(d3ReactAnchor)
                .select<SVGGElement>("#nodes");

            const conf = new GameMapConfig(this.graph.step);

            // mount units
            this.lnus = this.state.nodes.map(n => {
                let lnu = new LocationNodeUnit(n, this.graph, nodeContainer, true, conf);
                lnu.onDragEnd((_ =>  this.setState({nodes: this.graph.nodes})))
                return lnu;
            });

        }

    }

    componentDidUpdate(prevProps: Readonly<GameMainProps>, prevState: Readonly<GameMainState>, snapshot?: any): void {
        // this.lnus.forEach(_ => _.refresh());
    }

    public render() {

        return (
            <div
                className={GameMapEditor.cssClass}
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


export default GameMapEditor;

import React, {Component} from 'react';


import "../../../css/DirectedGraph.css";
import "../../../css/Editor.css"

import {Selection, select} from "d3-selection";
import {path, Path} from "d3-path";

import Tooltip from "../../ui/Tooltip";
import {GameMapConfig, GameMapHelpers} from "./GameMapHelpers";
import {LocationContext} from "ts-shared/build/lib/mechanics/Location";
import {Coordinate, ICoordinate} from "ts-shared/build/lib/geometry/Coordinate";
import LocationNode from "ts-shared/build/lib/graph/LocationNode";
import {MapEditorMap} from "./internal/MapEditorMap";
import LocationUnit from "../units/LocationUnit";


// todo: move state to props
interface GameMainProps {

}

interface GameMainState {
    displayTooltip: boolean;
    tooltipLocation: ICoordinate;
    cursorLocation: ICoordinate | undefined;
}

// type shorthand for ease of reading
type ReactSVGRef = React.RefObject<SVGSVGElement>;

class GameMapEditor extends Component<GameMainProps, GameMainState> {
    state: GameMainState;
    nodeContext: LocationContext<LocationUnit> = new LocationContext<LocationUnit>(10);
    private svgElement: ReactSVGRef = React.createRef();
    public static readonly cssClass: string = "map-editor";

    constructor(props: any) {
        super(props);

        // conversion from LocationNode to LocationUnit will occur in the websocket util
        const a = new LocationUnit("Location A", "a", new Coordinate(10, 10),2);
        const b = new LocationUnit("Location B", "b", new Coordinate(20, 10),2);
        const c = new LocationUnit("Location C", "c", new Coordinate(10, 20),2);
        const d = new LocationUnit("Location D", "d", new Coordinate(44, 37),2);

        a.connectTo(b);

        const locations = [
            a,
            b,
            c,
            d
        ];

        this.nodeContext.add(...locations);

        this.state = {
            displayTooltip: false,
            tooltipLocation: new Coordinate(0, 0),
            cursorLocation: undefined
        };

    }

    /** Once HTML elements have loaded, this method is run to initialize the SVG elements using D3. */
    private initializeGraph(): void {
        const drawGrid = (context: Path): Path => {
            const xDomain = this.nodeContext.domain.x,
                yDomain = this.nodeContext.domain.y;

            for (let col = xDomain.min; xDomain.contains(col); col += xDomain.step) {
                context.moveTo(col, yDomain.min);
                context.lineTo(col, yDomain.max);
            }

            for (let row = yDomain.min; yDomain.contains(row); row += yDomain.step) {
                context.moveTo(xDomain.min, row);
                context.lineTo(xDomain.max, row);
            }

            return context;
        };
        const updateTooltipLocation = (x: number, y: number): void => this.setState({tooltipLocation: new Coordinate(x, y)});
        const updateCursorLocation = (x: number, y: number): void => this.setState({cursorLocation: new Coordinate(x, y)});


        // draw grid
        // const gridGroup = mainGroup.append("g")
        //     .attr("id", "grid")
        //     .attr("pointer-events", "none");
        //
        //
        // gridGroup.append("rect")
        //     .attr("x", gridCoords.topL.x)
        //     .attr("y", gridCoords.topL.y)
        //     .attr("height", gridCoords.topL.distance(gridCoords.bottomL))
        //     .attr("width", gridCoords.topL.distance(gridCoords.topR))
        //     .attr("fill", "#dedede");
        //
        //
        // gridGroup.append("path")
        //     .classed("grid", true)
        //     .attr("d", drawGrid(path()).toString());

        // append edges svg group
        // mainGroup.append("g")
        //     .attr("id", "edges");
        //
        // // append nodes svg group
        // mainGroup.append("g")
        //     .attr("id", "nodes")
        //     .classed("node", true);
        //
        //
        // // append menu
        // const bottomMenu = select(this.svgElement.current)
        //     .append("g")
        //     .attr("id", "bottom-menu");
        // this.initBottomMenu(bottomMenu);

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
    // private drawEdge(edge: DirectedEdge, context: Path, curved?: boolean): Path {
    //     const drawStraightEdge = (edge: DirectedEdge, context: Path): Path => {
    //         const {from, to} = edge;
    //
    //         context.moveTo(from.x, from.y);
    //         context.lineTo(to.x, to.y);
    //
    //         return context;
    //     };
    //     const drawCurvedEdge = (edge: DirectedEdge, context: Path, intersectingNode: Node): Path => {
    //         const tangentPoint = edge.getArcToTangentPoint(intersectingNode);
    //         context.moveTo(edge.from.x, edge.from.y);
    //         context.arcTo(tangentPoint.x, tangentPoint.y, edge.to.x, edge.to.y, edge.getCurveRadius(intersectingNode));
    //         context.lineTo(edge.to.x, edge.to.y);
    //         return context;
    //     };
    //
    //     // todo: handle more than 1 inter
    //     const intersectingNode = this.graph.getNodesIntersectingWith(edge)[0];
    //
    //     // drawStraightEdge(edge, context);
    //     if (intersectingNode) return drawCurvedEdge(edge, context, intersectingNode);
    //     else return drawStraightEdge(edge, context);
    // }

    /** re-evaluates data and renders graph */
    private updateGraph(): void {

        // this.renderEdges();

    }

    /** renders edges contained by each node */
    // private renderEdges() {
    //     const graphEdgeContainer = select(this.svgElement.current)
    //         .select("#edges");
    //
    //     const graphEdges = graphEdgeContainer
    //         .selectAll<SVGPathElement, Node>("path")
    //         .data<DirectedEdge>(this.state.nodes.flatMap(_ => _.edges), _ => _.id);
    //
    //     // add new edges
    //     const edgeGroupOnEnter = graphEdges.enter()
    //         .append("g")
    //         .attr("class", ".directed-graph-edge");
    //
    //     // remove old unused edges
    //     graphEdges.exit().remove();
    //
    //     // update path of unchanged edges
    //     graphEdges.attr("d", edge => this.drawEdge(edge, path(), true).toString())
    //
    //     // draw new edges
    //     edgeGroupOnEnter.append("path")
    //         .classed("edge", true)
    //         .attr("d", edge => this.drawEdge(edge, path(), true).toString());
    //
    //     return graphEdgeContainer;
    // }

    componentDidMount(): void {
        this.initializeGraph();

        const d3ReactAnchor = this.svgElement.current


        if (d3ReactAnchor) {

            const conf = {
                backgroundColor: "#dbdbdb",
                foregroundColor: "#c4c4c4",
                gridStroke: "#545454",
                zoomBuffer: 25,
            };

            new MapEditorMap(this.nodeContext, d3ReactAnchor, conf);


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

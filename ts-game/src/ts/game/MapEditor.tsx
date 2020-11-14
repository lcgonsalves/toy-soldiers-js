import React, {Component} from 'react';
import {pointer, select} from "d3-selection";
import {path, Path} from "d3-path";
import {drag, DragBehavior, DraggedElementBaseType, SubjectPosition} from "d3-drag";
import Node from "ts-shared/build/graph/Node";
import DirectedGraph from "ts-shared/build/graph/DirectedGraph";
import DirectedEdge from "ts-shared/build/graph/DirectedEdge";
import "../../css/DirectedGraph.css";
import "../../css/Editor.css"
import {Coordinate, ICoordinate} from "ts-shared/build/geometry/Coordinate";
import Tooltip from "../ui/Tooltip";

// todo: move state to props
interface GameMainProps {

}
interface GameMainState {
    nodes: Node[],
    displayTooltip: boolean,
    tooltipLocation: ICoordinate,
    cursorLocation: ICoordinate | undefined,
    spcialKeysPressed: {
        [key: string]: boolean
    }
}

// type shorthand for ease of reading
type SVGElement = React.RefObject<SVGSVGElement>;

enum SupportedSpecialKey {
    Shift = "Shift",
    Control = "Control"
}
type KeyActivationMap = { [key: string]: boolean };
class SpecialKey {
    public static readonly allowed: string[] = Object.keys(SupportedSpecialKey);
    public static defaultPressMap(): KeyActivationMap {
        const map: { [key: string]: boolean } = {};
        SpecialKey.allowed.forEach(key => map[key] = false);
        return map;
    };
    public static convertToCSSClass(map: KeyActivationMap): string[] {
        return Object.keys(map)
          .filter(key => this.allowed.includes(key) && map[key])
          .map(key => {
              switch (key) {
                  case SupportedSpecialKey.Shift:
                      return "shift-pressed";
                  case SupportedSpecialKey.Control:
                      return "ctrl-pressed";
              }
          }) as string[];
    }
}
class MapEditor extends Component<GameMainProps, GameMainState> {
    state: GameMainState;
    private graph: DirectedGraph = new DirectedGraph();
    private svgElement: SVGElement = React.createRef();
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
            cursorLocation: undefined,
            spcialKeysPressed: SpecialKey.defaultPressMap()
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
        const updateTooltipLocation = (x: number, y: number): void => this.setState({tooltipLocation: new Coordinate(x ,y)});
        const updateCursorLocation = (x: number, y: number): void => this.setState({cursorLocation: new Coordinate(x ,y)});
        const isShiftPressed = () => this.state.spcialKeysPressed[SupportedSpecialKey.Shift];

        const mainGroup = select(this.svgElement.current)
            .append("g")
            .attr("id", "main")
            .on("mousemove", function (this: any, evt: any) {
              if (isShiftPressed()) {
                  const [x,y] = pointer(evt);
                  updateCursorLocation(x,y);
              }
            });

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

        // append add-node icon svg group
        mainGroup.append("g")
          .attr("id", "add-nodes");

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
                .attr("x", x + dataPoint.radius + 1)
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
        const drawCurvedEdge = (edge: DirectedEdge, context: Path, intersectingNode: Node): Path => {
            const midpoint = edge.midpoint;
            const tangentPoint = edge.getArcToTangentPoint(intersectingNode);

            context.moveTo(midpoint.x, midpoint.y);
            context.lineTo(tangentPoint.x, tangentPoint.y);

            context.moveTo(edge.from.x, edge.from.y);
            context.arcTo(tangentPoint.x, tangentPoint.y, edge.to.x, edge.to.y, edge.getCurveRadius(intersectingNode));
            context.lineTo(edge.to.x, edge.to.y);
            return context;
        };

        // todo: handle more than 1 inter
        const intersectingNode = this.graph.getNodesIntersectingWith(edge)[0];

        // drawStraightEdge(edge, context);
        if (intersectingNode)  return drawCurvedEdge(edge, context, intersectingNode);
        else return drawStraightEdge(edge, context);
    }

    /** re-evaluates data and renders graph */
    private updateGraph(): void {

        const graphEdgeContainer = this.renderEdges();

        this.renderNodes();

        this.renderAddNodeHelperIcons();

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
            .attr("x", node => node.x + node.radius + 1)
            .attr("y", node => node.y);

        // add newly added nodes if any
        const nodeG = graphNodes.enter()
            .append("g")
            .classed("node_container", true)
            .call(this.initDragHandlers<SVGGElement, Node>());

        nodeG.append("circle")
            .classed("node", true)
            .attr("cx", node => node.x)
            .attr("cy", node => node.y)
            .attr("r", node => node.radius);

        nodeG.append("text")
            .classed("node_label", true)
            .attr("x", node => node.x + node.radius + 1)
            .attr("y", node => node.y)
            .text(node => node.id);

        // remove nodes that don't exist anymore
        graphNodes.exit().remove();
    }

    /** shows circles where nodes can be added */
    private renderAddNodeHelperIcons() {
        if (!this.state.cursorLocation) return;

        const possibleNodeAdditionsNearby: ICoordinate[] = [];
        const {x,y} = this.state.cursorLocation;
        const snappedCoord = DirectedGraph.snapToGrid(this.state.cursorLocation.x, this.state.cursorLocation.y);

        if (this.state.spcialKeysPressed[SupportedSpecialKey.Shift]) {
            const possibilities = [-this.graph.step, 0, this.graph.step];
            possibilities.forEach((A) => {
                possibilities.forEach((B) => {
                    let c = new Coordinate(snappedCoord.x, snappedCoord.y).moveBy(A, B);
                    if (this.graph.domain.x.contains(c.x) && this.graph.domain.y.contains(c.y) && !this.graph.containsNodeAtPosition(c))
                        possibleNodeAdditionsNearby.push(c);
                });
            });
        }

        const nodeWidth = 2.4;

        // select nodes
        const graphNodes = select(this.svgElement.current)
          .select("#add-nodes")
          .selectAll<SVGCircleElement, ICoordinate>("g")
          .data<ICoordinate>(possibleNodeAdditionsNearby, _ => `(${_.x}, ${_.y})`);

        graphNodes
          .selectAll<SVGCircleElement, ICoordinate>("circle")
          .filter(_ => !_.equals(snappedCoord))
          .attr("r", nodeWidth / 2)
          .attr("opacity", 0.6);

        graphNodes
          .selectAll<SVGCircleElement, ICoordinate>("circle")
          .filter(_ => _.equals(snappedCoord))
          .attr("r", nodeWidth)
          .attr("opacity", 0.9);

        graphNodes
          .selectAll<SVGTextElement, ICoordinate>("text")
          .attr("x", coord => coord.x - (coord.equals(snappedCoord) ? nodeWidth / 2 : nodeWidth / 4))
          .classed("node-add-helper-plus-small", _ => !_.equals(snappedCoord))
          .classed("node-add-helper-plus-large", _ => _.equals(snappedCoord));


        const helperNodes = graphNodes.enter()
          .append("g")
          .classed("node-add-helper-container", true);

        helperNodes
          .filter(_ => !_.equals(snappedCoord))
          .classed("outer", true)
          .append("circle")
          .classed("node-add-helper-circle", true)
          .attr("cx", coord => coord.x)
          .attr("cy", coord => coord.y)
          .attr("r", nodeWidth / 2)
          .attr("opacity", 0.6);

        helperNodes
          .filter(_ => _.equals(snappedCoord))
          .classed("inner", true)
          .append("circle")
          .classed("node-add-helper-circle", true)
          .attr("cx", coord => coord.x)
          .attr("cy", coord => coord.y)
          .attr("r", nodeWidth)
          .attr("opacity", 0.9);

        helperNodes.append("text")
          .attr("alignment-baseline", "central")
          .classed("node-add-helper-plus-small", _ => !_.equals(snappedCoord))
          .classed("node-add-helper-plus-large", _ => _.equals(snappedCoord))
          .attr("x", coord => coord.x - (coord.equals(snappedCoord) ? nodeWidth / 2 : nodeWidth / 4))
          .attr("y", coord => coord.y)
          .text("+");

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


    /** renders tooltip in appropriate position */
    private renderTooltip(x: number, y: number) {
        const CSSPosition = {
            left: `${x}px`,
            top: `${y}px`
        };

        return <div className="tooltip" style={CSSPosition}>
            <button onClick={() => console.log("click")}>+</button>
        </div>
    }

    private onSpecialKeyAction(keyCode: string, isActive: boolean): void {
        const isKeyValid = Object.keys(SupportedSpecialKey).includes(keyCode);
        if (isKeyValid) {
            this.setState(prevState => {
                const updatedActiveKeyMapping = prevState.spcialKeysPressed;
                updatedActiveKeyMapping[keyCode] = isActive;

                return {
                    spcialKeysPressed: {...updatedActiveKeyMapping}
                }
            });
        }
    }

    public render() {

        const concatCSSClasses = (...classes: string[]): string => classes.reduce((prev, cur) => `${prev} ${cur}`);

        return (
          <div
            className={concatCSSClasses(MapEditor.cssClass, ...SpecialKey.convertToCSSClass(this.state.spcialKeysPressed))}
            tabIndex={0}
            onKeyDown={evt => this.onSpecialKeyAction(evt.key, true)}
            onKeyUp={evt => this.onSpecialKeyAction(evt.key, false)}
          >
              <Tooltip display={this.state.displayTooltip} position={this.state.tooltipLocation} cooldown={3000} />
              <svg
                ref={this.svgElement}
                height="90vh"
                width="90vw"
                viewBox={`-10 -10 110 110`}
              />
          </div>
        );
    }

}


export default MapEditor;
import GameUnit from "./GameUnit";
import Node from "ts-shared/build/graph/Node";
import {select, Selection} from "d3-selection";
import {path} from "d3-path";
import {drag, DragBehavior, SubjectPosition} from "d3-drag";
import {GameMapConfig, GameMapHelpers} from "../map/GameMapHelpers";
import {Coordinate, ICoordinate} from "ts-shared/build/geometry/Coordinate";
import DirectedEdge from "ts-shared/build/graph/DirectedEdge";
import SVGAttrs from "../../util/SVGAttrs";
import SVGTags from "../../util/SVGTags";
import DirectedGraph from "ts-shared/build/graph/DirectedGraph";

export enum css {
    GRABBED = "grabbed",
    NODE_CIRCLE = "node_circle",
    NODE_LABEL = "node_label",
    EDGE = "node_edge",
    EDGEPATH = "node_edge_path",
    EDGE_CONTAINER = "edge_container"
}

/**
 * Represents a graph node game unit. Can represent location, or a position. Can represent
 * players or other actors. It's abstract. I don't know what else to put down at time of writing.
 * I am tired :D
 */
export default abstract class AbstractNodeUnit<
    AssociatedNode extends Node,
    AssociatedElement extends SVGGElement = SVGGElement
    > extends GameUnit<AssociatedNode, AssociatedElement> {

    /** Defines whether drag behavior is enabled or disabled */
    private _draggable: boolean = false;
    /** D3.zoom() reference */
    protected dragBehavior: DragBehavior<AssociatedElement, AssociatedNode, SubjectPosition | AssociatedNode> | undefined;
    /** Drag configuration parameters */
    private _config: GameMapConfig | undefined;

    // drag callback references
    private _extendedOnDrag: (evt: any, n: AssociatedNode, coords: ICoordinate) => void;
    private _extendedOnDragStart: (evt: any, n: AssociatedNode, coords: ICoordinate) => void
    private _extendedOnDragEnd: (evt: any, n: AssociatedNode, coords: ICoordinate) => void;

    // transition definitions

    /** Selection containing the edges from this node */
    protected edgeSelection: Selection<SVGGElement, AssociatedNode, SVGElement, any>;
    public static edgeContainerID: string = css.EDGE_CONTAINER

    /** Geographical Context reference */
    protected readonly graph: DirectedGraph;

    /** Returns associated node */
    get node(): AssociatedNode { return this.datum }

    // drag callbacks
    protected get extendedOnDragEnd(): (evt: any, n: AssociatedNode, coords: ICoordinate) => void {
        return this._extendedOnDragEnd;
    }
    protected get extendedOnDragStart(): (evt: any, n: AssociatedNode, coords: ICoordinate) => void {
        return this._extendedOnDragStart;
    }
    protected get extendedOnDrag(): (evt: any, n: AssociatedNode, coords: ICoordinate) => void {
        return this._extendedOnDrag;
    }
    protected get config(): GameMapConfig | undefined {
        return this._config;
    }

    protected constructor(
        node: AssociatedNode,
        graph: DirectedGraph,
        anchor: Selection<any, AssociatedNode, any, any>,
        draggable: boolean = false,
        dragConfig: GameMapConfig | undefined = draggable ? GameMapConfig.default : undefined,
        tag: string
    ) {
        super(
            node.id,
            node.x,
            node.y,
            node,
            anchor,
            tag,
            s => s.append<SVGGElement>(SVGTags.SVGGElement).attr(SVGAttrs.id, css.EDGE_CONTAINER)
        );

        this.graph = graph.contains(node) ? graph : NodeNotInGraphError.default(node);

        // reselect after super.constructor appends
        this.edgeSelection = this.current.select(`#${css.EDGE_CONTAINER}`);

        // this.renderEdgeDepiction();

        this.dragBehavior = draggable ? drag<AssociatedElement, AssociatedNode>() : undefined;
        this._config = dragConfig;
        this._extendedOnDrag = function (){};
        this._extendedOnDragEnd = function (){};
        this._extendedOnDragStart = function (){};

        if (draggable && dragConfig && this.dragBehavior) {
            this.initializeDefaultDragBehavior();
            this.anchor.call(this.dragBehavior);
        }

    }

    /** Append entered edge elements to the graph */
    protected abstract renderEdgeDepiction(): void;

    /** Update edge elements to the graph */
    protected abstract updateEdgeDepiction(): void;

    /** Remove exited elements to the graph */
    protected abstract removeEdgeDepiction(): void;

    /**
     * Associates default drag behavior to the node. This includes automatically associating a
     * css.grabbed class upon start of grab, and removing said class upon end of grab
     * Implementations of a draggable AbstractNodeUnit require implementing their own versions
     * of defaultOnDragGrabbed() due to the scope of the definition of a depiction of a node.
     *
     * Only assigns handlers if dragBehavior is defined.
     *
     * In short, at this point, we just don't know how the coordinate of the node will relate
     * to the positions of the SVG elements that depict it. Whew.
     *
     * @private
     */
    private initializeDefaultDragBehavior(): DragBehavior<AssociatedElement, AssociatedNode, SubjectPosition | AssociatedNode> | undefined {
        this.dragBehavior?.on(event.START, this.defaultOnDragStart())
            .on(event.DRAG, this.defaultOnDragGrabbed())
            .on(event.END, this.defaultOnDragEnd());

        return this.dragBehavior;
    }

    /** Moves this unit to coords */
    protected propagateDatumUpdate() {
        this.moveToCoord(this.datum);
    }

    /**
     * Creates a callback function to NodeUnit beginning drag event. Sets css.grabbed class by default.
     *
     * @param evt {{x: number, y: number}} drag event reference, contains coordinates
     * @param dataPoint {AssociatedNode} reference to Node associated with this Unit.
     * @protected
     */
    protected defaultOnDragStart<E extends AssociatedElement>(): (this: AssociatedElement, evt: any, n: AssociatedNode) => void {
        // use this space to access the "this" context -- thanks d3
        const {extendedOnDragEnd} = this;

        return function (this: AssociatedElement, evt: any, n: AssociatedNode) {
            select(this).classed(css.GRABBED, true);

            extendedOnDragEnd(evt, n, new Coordinate(evt.x, evt.y))
        };
    }

    /**
     * Returns the css #id of the given edge for selection.
     *
     * @param e
     * @protected
     */
    protected getEdgeCSSIdentifier<E extends DirectedEdge>(e: E) {
        return `${this.id}_edge_to_${e.to.id}`
    }

    /**
     * Creates a callback function to NodeUnit being in the middle of a drag event. Implementations
     * must update the locations of the svg elements used in the depiction.
     *
     * @param evt {{x: number, y: number}} drag event reference, contains coordinates
     * @param dataPoint {AssociatedNode} reference to Node associated with this Unit.
     * @protected
     */
    protected defaultOnDragGrabbed<E extends AssociatedElement>(): (this: AssociatedElement, evt: any, n: AssociatedNode) => void {
        const config = this.config ? this.config : GameMapConfig.default;

        const updateDepiction = this.updateDepiction.bind(this);
        const {extendedOnDrag} = this;

        return function (this: AssociatedElement, evt: any, n: AssociatedNode) {
            const evtCoord = new Coordinate(evt.x, evt.y);

            // update position of node
            config.snapWhileDragging ? n.moveToCoord(GameMapHelpers.snapIfWithinRadius(evtCoord, config)) : n.moveToCoord(evtCoord);

            // refresh depiction
            updateDepiction();

            extendedOnDrag(evt, n, evtCoord);
        }
    }

    /**
     * Creates a callback function to NodeUnit ending a drag event. Removes css.grabbed class by default.
     *
     * @param evt {{x: number, y: number}} drag event reference, contains coordinates
     * @param dataPoint {AssociatedNode} reference to Node associated with this Unit.
     * @protected
     */
    protected defaultOnDragEnd<E extends AssociatedElement>(): (this: AssociatedElement, evt: any, n: AssociatedNode) => void {
        // use this space to access the "this" context -- thanks d3
        const config = this.config ? this.config : GameMapConfig.default;

        const updateDepiction = this.updateDepiction.bind(this);
        const {extendedOnDragEnd} = this;

        return function (this: AssociatedElement, evt: any, n: AssociatedNode) {
            const {x, y} = evt;
            let coords = new Coordinate(x, y);

            select(this).classed(css.GRABBED, false)

            coords = config?.snapOnEnd? n.moveToCoord(GameMapHelpers.snap(coords)) : n.moveToCoord(coords);

            // refresh depiction
            updateDepiction();

            extendedOnDragEnd(evt, n, coords);
        };
    }

    /**
     * Assigns additional custom behavior while dragging. If null, behaviour is removed.
     * @param {(evt: any, n: AssociatedNode, coords: ICoordinate) => void) | null} handler function where evt is the
     * event associated with the drag event, n is the node associated with the element, and coords is the coordinate of the event.
     */
    public onDrag(handler: ((evt: any, n: AssociatedNode, coords: ICoordinate) => void) | null): void {
        if (handler === null) this._extendedOnDrag = () => {}
        else this._extendedOnDrag = handler;
    }

    /**
     * Assigns additional custom behavior after drag is done. If null, behaviour is removed.
     * @param {(evt: any, n: AssociatedNode, coords: ICoordinate) => void) | null} handler function where evt is the
     * event associated with the drag event, n is the node associated with the element, and coords is the coordinate of the event.
     */
    public onDragEnd(handler: ((evt: any, n: AssociatedNode, coords: ICoordinate) => void) | null): void {
        if (handler === null) this._extendedOnDrag = () => {}
        else this._extendedOnDragEnd = handler;
    }

    /**
     * Assigns additional custom behavior upon drag start. If null, behaviour is removed.
     * @param {(evt: any, n: AssociatedNode, coords: ICoordinate) => void) | null} handler function where evt is the
     * event associated with the drag event, n is the node associated with the element, and coords is the coordinate of the event.
     */
    public onDragStart(handler: ((evt: any, n: AssociatedNode, coords: ICoordinate) => void) | null): void {
        if (handler === null) this._extendedOnDrag = () => {}
        else this._extendedOnDragStart = handler;
    }

    /** Returns recently joined edges of node (path elements) */
    protected get currentEdgePathSelection(): Selection<SVGPathElement, DirectedEdge, SVGGElement, AssociatedNode> {
        return this.edgeSelection
            .selectAll<SVGPathElement, DirectedEdge>(SVGTags.SVGPathElement)
            .data<DirectedEdge>(this.datum.edges, _ => _.id);
    }

    /** Returns recently joined edges of node (parent group for each edge) */
    protected get currentEdgeGroupSelection(): Selection<SVGGElement, DirectedEdge, SVGElement, any> {
        return this.edgeSelection.data<DirectedEdge>(this.datum.edges, _ => _.id);
    }

    /** Draws path. Path can currently dodge 1 intersecting node */
    protected drawEdgePath(e: DirectedEdge): string {
        const p = path();
        debugger

        // TODO: handle more than 1 intersecting node, maybe?
        const intersectingNode = this.graph?.getNodesIntersectingWith(e)[0];
        const {from, to} = e;

        p.moveTo(from.x, from.y);

        // curve around intersecting node
        if (intersectingNode) {
            const tangentPoint = e.getArcToTangentPoint(intersectingNode);
            p.arcTo(tangentPoint.x, tangentPoint.y, e.to.x, e.to.y, e.getCurveRadius(intersectingNode));
        }

        p.lineTo(to.x, to.y);

        return p.toString();
    }

}

export class NodeNotInGraphError extends Error {

    static defaultMessage<N extends Node = Node>(node: N): string {
        return `Cannot associate Node ${node.id} at (${node.x}, ${node.y}) to graph which doesn't contain it.`
    }

    static default<N extends Node = Node>(node: N): never {
        throw new NodeNotInGraphError(NodeNotInGraphError.defaultMessage(node))
    }

}

// supported events
enum event {
    START = "start",
    DRAG = "drag",
    END = "end"
}

export enum msg {
    NO_EDGE_SELECTION = "Edge Selection is undefined.",
    CANNOT_INITIALIZE_DEPICTION = "Cannot append depiction at this time.",
    CANNOT_RETURN_SELECTION = "Cannot perform this operation at this time."
}

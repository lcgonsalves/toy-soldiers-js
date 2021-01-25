/**
 * Represents a Location node in the front end.
 */
import LocationNode from "ts-shared/build/lib/graph/LocationNode";
import {Coordinate, ICoordinate} from "ts-shared/build/lib/geometry/Coordinate";
import {select, Selection} from "d3-selection";
import SVGTags from "../../util/SVGTags";
import {AnySelection, getArcToTangentPoint, getCurveRadius} from "../../util/DrawHelpers";
import SVGAttrs from "../../util/SVGAttrs";
import {IGraphEdge, IGraphNode} from "ts-shared/build/lib/graph/GraphInterfaces";
import {path} from "d3-path";
import {DragEvents, DragHandler, Handler, IDraggable, INodeUnit} from "./UnitInterfaces";
import {DestinationInvalidError} from "../../util/Errors";
import {drag} from "d3-drag";
import {GameMapConfig} from "../map/GameMapHelpers";
import WorldContext from "ts-shared/build/lib/mechanics/WorldContext";
import AbstractNode from "ts-shared/build/lib/graph/AbstractNode";
import {Transition, transition} from "d3-transition";
import {easeCubicIn, easeExpIn, easeExpOut, easeLinear} from "d3-ease";

type ContainerElement = SVGGElement;
type LocationUnitSelection<Datum> = Selection<ContainerElement, Datum, any, any>;
type Edge = IGraphEdge<LocationUnit, LocationUnit>;

export enum LocationUnitCSS {
    GRABBED = "grabbed",
    NODE_CIRCLE = "node_circle",
    NODE_LABEL = "node_label",
    EDGE = "node_edge",
    EDGEPATH = "node_edge_path",
    EDGE_CONTAINER = "edge_container",
    DEBUG = "debug",
    DEBUG_NODE = "debug_node",
    DEBUG_EDGE = "debug_edge",
    DEBUG_TEXT = "debug_text",
    NONE = "none",
    INLINE = "inline"
}

/**
 * Most basic unit. Represents a location, can be connected to other locations.
 *
 * - Has simple drag mechanics that can be toggled.
 * - Has a label that can be displayed or hidden on command.
 */
export default class LocationUnit extends LocationNode implements INodeUnit, IDraggable {

    protected readonly name: string;
    protected anchor: LocationUnitSelection<LocationUnit> | undefined;
    protected edgeAnchor: LocationUnitSelection<Edge> | undefined;
    protected debugAnchor:LocationUnitSelection<LocationUnit> | undefined;
    protected config: GameMapConfig = GameMapConfig.default

    // drag handlers
    protected readonly dragStartHandlers: Map<string, DragHandler> = new Map<string, DragHandler>();
    protected readonly dragHandlers: Map<string, DragHandler> = new Map<string, DragHandler>();
    protected readonly dragEndHandlers: Map<string, DragHandler> = new Map<string, DragHandler>();

    // hover handlers
    protected readonly onMouseInHandlers: Map<string, Handler> = new Map<string, any>();
    protected readonly onMouseOutHandlers: Map<string, Handler> = new Map<string, any>();

    public shouldDisplayLabel: boolean = false;

    private _debugMode: boolean = false;

    /** returns true if element is draggable (i.e. has default handlers in place) */
    get draggable(): boolean {

        const key = "default";
        return this.dragStartHandlers.has(key) && this.dragHandlers.has(key) && this.dragEndHandlers.has(key);

    }

    /** setting this to true will assign default drag handlers that update the node's position, setting to false will disable them */
    set draggable(val: boolean) {

        const key = "default";

        if (val) {
            this.setDefaultDragHandlers();
        } else {
            this.dragStartHandlers.delete(key);
            this.dragHandlers.delete(key);
            this.dragEndHandlers.delete(key);
        }

    }

    get debugMode(): boolean {
        return this._debugMode;
    }

    set debugMode(turnOn: boolean) {
        this._debugMode = turnOn;

        if (!turnOn) {

            console.log("Turning off debug mode, removing all debug elements associated with this unit.");
            this.debugAnchor?.selectAll("*").remove();

        } else if (this.debugAnchor === undefined) {

            if (this.anchor === undefined) {
                console.error("Unable to attach debug anchor when unit has no anchor. Please run attachDepictionTo() in order to render debug elements.");
            } else {

                console.log("No debug anchor found, appending debug `g` element.");
                this.debugAnchor = this.anchor.append<ContainerElement>(SVGTags.SVGGElement).attr(SVGAttrs.id, LocationUnitCSS.DEBUG_NODE);
                console.log("Turning on debug mode, ready to render debug elements...");
            }

        } else {

            console.log("Turning on debug mode, ready to render debug elements...");

        }
    }

    get edges(): Edge[] {
        return [ ...this._edges.values() ] as Edge[];
    }

    get adjacent(): LocationNode[] {
        return [ ...this._edges.keys() ] as LocationNode[];
    }

    connectTo<N extends IGraphNode>(other: N, bidirectional?: boolean): LocationUnit {
        // guarantees that neighbors are all LocationUnits
        if (!(other instanceof LocationUnit)) throw new DestinationInvalidError();

        super.connectTo(other, bidirectional);
        return this;
    }

    get cls(): string {
        return this.constructor.name
    }

    get edgeContainerID(): string {
        return `${LocationUnitCSS.EDGE_CONTAINER}_${this.name}_${this.id}`;
    }

    constructor(name: string, id: string, position: ICoordinate, size: number) {
        super(id, size, position.x, position.y);
        this.name = name;

    }

    /**
     * Instantiates depiction of Location Unit to the SVG.
     * @param d3selection
     */
    attachDepictionTo(d3selection: AnySelection): void {
        const anchor = d3selection.append<ContainerElement>(SVGTags.SVGGElement);
        this.initDebug(anchor);

        // if there's a context associated, snap to value
        this.worldContext?.snap(this);

        // set attrs
        anchor.attr(SVGAttrs.id, this.id)
              .classed(this.cls, true)
              .on("mouseenter", this.applyAllHandlers(this.onMouseInHandlers))
              .on("mouseleave", this.applyAllHandlers(this.onMouseOutHandlers));

        // remove previous
        this.deleteDepiction();

        // data join
        this.anchor = anchor.datum<LocationUnit>(this);

        // circle
        this.anchor.append<SVGCircleElement>(SVGTags.SVGCircleElement)
            .attr(SVGAttrs.cx, _ => _.x)
            .attr(SVGAttrs.cy, _ => _.y)
            .attr(SVGAttrs.r, _ => _.radius)
            .classed(LocationUnitCSS.NODE_CIRCLE, true);

        // id
        this.anchor.append<SVGTextElement>(SVGTags.SVGTextElement)
            .attr(SVGAttrs.x, node => node.x + node.radius + 1)
            .attr(SVGAttrs.y, node => node.y)
            .attr(SVGAttrs.opacity, this.shouldDisplayLabel ? "1" : "0")
            .text(node => node.id)
            .classed(LocationUnitCSS.NODE_LABEL, true)

        this.initializeDrag();
        this.defaultDisplayLabelBehavior();

    }

    deleteDepiction(): void {
        if (this.anchor) this.anchor.remove();
    }


    /**
     * Draws edges of this unit.
     * @param d3selection
     */
    attachEdgeDepictionTo(d3selection: AnySelection): void {
        const anchor = d3selection.append<SVGGElement>(SVGTags.SVGGElement);

        anchor.attr(SVGAttrs.id, this.edgeContainerID);

        anchor.selectAll<SVGGElement, Edge>(SVGTags.SVGPathElement)
            .data<Edge>(this.edges, e => e.id)
            .enter()
            .append<SVGGElement>(SVGTags.SVGGElement) // select and append 1 group per edge
            .classed(LocationUnitCSS.EDGE, true)
            .append<SVGPathElement>(SVGTags.SVGPathElement) // append 1 path per group
            .classed(LocationUnitCSS.EDGEPATH, true)
            .attr(SVGAttrs.d, this.drawEdgePath.bind(this)); // draw path for the first time

        // // remove previous
        this.deleteEdgeDepiction();

        // save anchor
        this.edgeAnchor = anchor;

    }

    deleteEdgeDepiction(): void {
        this.edgeAnchor?.remove();
    }

    /** Draws path. Path can currently dodge 1 intersecting node */
    protected drawEdgePath(e: Edge): string {
        const p = path();


        // TODO: handle more than 1 intersecting node, maybe?
        // no
        const intersectingNodes = this.worldContext?.getNodesIntersecting(e);
        const intersectingNode = intersectingNodes ? intersectingNodes[0] : undefined;
        const {from, to} = e;

        p.moveTo(from.x, from.y);

        // curve around intersecting node
        const tangentPoint = getArcToTangentPoint(e, intersectingNode, 5);
        p.arcTo(tangentPoint.x, tangentPoint.y, e.to.x, e.to.y, getCurveRadius(e, intersectingNode, 5));

        p.lineTo(to.x, to.y);

        return p.toString();
    }

    protected shrinkEdgePath(e: Edge): string {

        const p = path();

        p.moveTo(e.from.x, e.from.y);
        p.lineTo(e.from.x, e.from.y);

        return p.toString();

    }

    associate<Node extends AbstractNode, Context extends WorldContext<Node>>(worldContext: Context): AbstractNode {
        // refresh default handlers because of association
        this.setDefaultDragHandlers();

        return super.associate(worldContext);
    }

    translateToCoord(other: ICoordinate): ICoordinate {

        super.translateToCoord(other);
        this.refresh();

        return this;
    }

    disconnectFrom<N extends IGraphNode>(other: N, bidirectional?: boolean): this {

        super.disconnectFrom(other, bidirectional);
        this.refreshEdgeDepiction();
        return this;

    }

    initializeDrag(): void {

        if (this.anchor) {

            const d = drag<any, any>();
            const {
                dragStartHandlers,
                dragHandlers,
                dragEndHandlers,
            } = this;

            this.setDefaultDragHandlers();

            d.on(DragEvents.START, function (this: SVGGElement, event: any, coords: ICoordinate): void {

                dragStartHandlers.forEach((action: DragHandler) => action(this, event, coords));

            });

            d.on(DragEvents.DRAG, function (this: SVGGElement, event: any, coords: ICoordinate): void {

                dragHandlers.forEach((action: DragHandler) => action(this, event, coords));

            });

            d.on(DragEvents.END, function (this: SVGGElement, event: any, coords: ICoordinate): void {

                dragEndHandlers.forEach((action: DragHandler) => action(this, event, coords));

            });

            this.anchor.call(d);

        }

    }

    /** by default displays label on hover and drag */
    defaultDisplayLabelBehavior(): void {

        const toggleLabel = "toggle_label";

        this.onDrag(toggleLabel, () => this.showLabel());
        this.onMouseIn(toggleLabel, () => this.showLabel());
        this.onMouseOut(toggleLabel, () => this.hideLabel());

    }

    /** by default, on drag the position is updated and the node is applied a css.GRABBED class */
    setDefaultDragHandlers(): void {

        const {
            config,
            worldContext
        } = this;

        this.dragStartHandlers.set(
            "default",
            function (elem: SVGGElement, evt: any) {
                select(elem).classed(LocationUnitCSS.GRABBED, true);
            });

        this.dragHandlers.set(
            "default",
            function (elem: SVGGElement, evt: any) {

                const selfRef = select<SVGGElement, LocationUnit>(elem).datum();
                const eventCoordinate: ICoordinate = new Coordinate(evt.x, evt.y);

                config.snapWhileDragging ?
                    worldContext.snap(selfRef) :
                    selfRef.translateToCoord(eventCoordinate);

            });

        this.dragEndHandlers.set(
            "default",
            function (elem: SVGGElement, evt: any) {
                select(elem).classed(LocationUnitCSS.GRABBED, false);

                const selfRef = select<SVGGElement, LocationUnit>(elem).datum();
                const eventCoordinate: ICoordinate = new Coordinate(evt.x, evt.y);

                config.snapOnEnd ?
                    worldContext.snap(selfRef):
                    selfRef.translateToCoord(eventCoordinate);

            });

    }

    onDrag(actionName: string, newAction: DragHandler): string {
        this.dragHandlers.set(
            actionName,
            newAction
        );

        return actionName;
    }

    onDragEnd(actionName: string, newAction: DragHandler): string {
        this.dragEndHandlers.set(
            actionName,
            newAction
        );

        return actionName;
    }

    onDragStart(actionName: string, newAction: DragHandler): string {
        this.dragStartHandlers.set(
            actionName,
            newAction
        );

        return actionName;
    }

    removeOnDrag(actionName: string): boolean {
        return this.dragHandlers.delete(actionName);

    }

    removeOnDragEnd(actionName: string): boolean {
        return this.dragEndHandlers.delete(actionName);
    }

    removeOnDragStart(actionName: string): boolean {
        return this.dragStartHandlers.delete(actionName);
    }

    onMouseIn(actionName: string, newAction: Handler): string {

        this.onMouseInHandlers.set(actionName, newAction);

        return actionName;

    }

    removeOnMouseIn(actionName: string): boolean {
        return this.onMouseInHandlers.delete(actionName);
    }

    onMouseOut(actionName: string, newAction: Handler): string {

        this.onMouseOutHandlers.set(actionName, newAction);

        return actionName;

    }

    removeOnMouseOut(actionName: string): boolean {
        return this.onMouseOutHandlers.delete(actionName);
    }

    applyAllHandlers(handlers: Map<string, Handler>): Handler {

        return function (this: SVGGElement, event: any) {

            // typescript doesn't like function "this" contexts
            for (let handler of handlers.values()) {
                // @ts-ignore
                handler(this, event)
            }

        }

    }

    showLabel(): void {

        if (this.shouldDisplayLabel)
            this.anchor?.select("." + LocationUnitCSS.NODE_LABEL)
                .transition()
                .duration(210)
                .ease(easeExpOut)
                .attr(SVGAttrs.opacity, "1");

    }

    hideLabel(): void {

        this.anchor?.select("." + LocationUnitCSS.NODE_LABEL)
            .transition()
            .duration(1000)
            .ease(easeExpIn)
            .attr(SVGAttrs.opacity, "0");

    }

    toggleLabel(): void {

        if (this.shouldDisplayLabel) this.showLabel();
        else this.hideLabel();

    }

    refresh(): void {

        if (this.anchor) {

            const node = this.anchor.datum(this);

            // node update
            node.select("." + LocationUnitCSS.NODE_CIRCLE)
                .attr(SVGAttrs.cx, node => node.x)
                .attr(SVGAttrs.cy, node => node.y)
                .attr(SVGAttrs.r, node => node.radius);

            node.select("." + LocationUnitCSS.NODE_LABEL)
                .attr(SVGAttrs.x, node => node.x + node.radius + 1)
                .attr(SVGAttrs.y, node => node.y)
                .text(node => node.id);

        }

        this.refreshEdgeDepiction();

    }

    /** refresh just edges
     * Useful if you moved a node somewhere in the graph, and need to update its connections.
     * */
    refreshEdgeDepiction(): void {

        if (this.edgeAnchor) {

            const edges = this.edgeAnchor.selectAll<SVGPathElement, Edge>(SVGTags.SVGPathElement)
                .data<Edge>(this.edges, _ => _.id);

            edges.enter()
                .append<SVGGElement>(SVGTags.SVGGElement) // select and append 1 group per edge
                .classed(LocationUnitCSS.EDGE, true)
                .append<SVGPathElement>(SVGTags.SVGPathElement) // append 1 path per group
                .classed(LocationUnitCSS.EDGEPATH, true)
                .attr(SVGAttrs.d, this.drawEdgePath.bind(this)); // draw path for the first time

            // edge update
            edges.attr(SVGAttrs.d, this.drawEdgePath.bind(this));

            edges.exit<Edge>()
                .transition()
                .duration(200)
                .attr(SVGAttrs.d, this.shrinkEdgePath)
                .remove();

        }

    }

    // DEBUGGING METHODS

    renderDebugHelpers(
        points: IGraphNode[],
        lines: IGraphEdge<IGraphNode, IGraphNode>[]
    ): void {

        if (this.debugAnchor !== undefined && this.debugMode) {

            const debugPathAnchor = this.debugAnchor
                .selectAll<SVGGElement, IGraphEdge<IGraphNode, IGraphNode>>("." + LocationUnitCSS.DEBUG_EDGE)
                .data<IGraphEdge<IGraphNode, IGraphNode>>(lines, _ => _.id);

            const debugPathTextAnchor = this.debugAnchor
                .selectAll<SVGGElement, IGraphEdge<IGraphNode, IGraphNode>>("." + LocationUnitCSS.DEBUG_TEXT + LocationUnitCSS.DEBUG_EDGE)
                .data<IGraphEdge<IGraphNode, IGraphNode>>(lines, _ => _.id);

            const debugCircleAnchor = this.debugAnchor
                .selectAll<SVGGElement, IGraphNode>("." + LocationUnitCSS.DEBUG_NODE)
                .data<IGraphNode>(points, _ => _.id);

            const debugCircleTextAnchor = this.debugAnchor
                .selectAll<SVGGElement, IGraphNode>("." + LocationUnitCSS.DEBUG_TEXT + LocationUnitCSS.DEBUG_NODE)
                .data<IGraphNode>(points, _ => _.id);

            debugPathAnchor.enter()
                .append(SVGTags.SVGPathElement)
                .classed(LocationUnitCSS.DEBUG_NODE, true)
                .attr(SVGAttrs.id, _ => _.id)
                .attr(SVGAttrs.d, (edge: IGraphEdge<IGraphNode, IGraphNode>) => {
                    const ctx = path();

                    ctx.moveTo(edge.from.x, edge.from.y);
                    ctx.lineTo(edge.to.x, edge.to.y);

                    return ctx.toString();
                })
                .each( e => {

                    const selfRef = `[${this.name}, id: ${this.id}] `
                    console.log(`${selfRef} ${e.id}: 
                    midpoint = ${e.midpoint}
                    size = ${e.size}`);

                });


            debugPathAnchor.attr(SVGAttrs.d, (edge: IGraphEdge<IGraphNode, IGraphNode>) => {
                const ctx = path();

                ctx.moveTo(edge.from.x, edge.from.y);
                ctx.lineTo(edge.to.x, edge.to.y);

                return ctx.toString();
            });

            debugPathAnchor.exit().remove();

            debugPathTextAnchor.enter()
                .append(SVGTags.SVGTextElement)
                .classed(LocationUnitCSS.DEBUG_TEXT + LocationUnitCSS.DEBUG_EDGE, true)
                .attr(SVGAttrs.x, _ => _.midpoint.x)
                .attr(SVGAttrs.y, _ => _.midpoint.y)
                .text(e => e.id + "_debug");

            debugPathTextAnchor
                .attr(SVGAttrs.x, _ => _.midpoint.x)
                .attr(SVGAttrs.y, _ => _.midpoint.y);

            debugPathTextAnchor.exit().remove();

            debugCircleAnchor.enter()
                .append(SVGTags.SVGCircleElement)
                .classed(LocationUnitCSS.DEBUG_NODE, true)
                .attr(SVGAttrs.cx, n => n.x)
                .attr(SVGAttrs.cy, n => n.y)
                .attr(SVGAttrs.r, n => n.radius)
                .each(n => {

                    const selfRef = `[${this.name}, id: ${this.id}] `
                    console.log(`${selfRef} ${n.id}: ${n.toString()} 
                    radius = ${n.radius}`);

                });

            debugCircleAnchor
                .attr(SVGAttrs.cx, n => n.x)
                .attr(SVGAttrs.cy, n => n.y)
                .attr(SVGAttrs.r, n => n.radius);

            debugCircleAnchor.exit().remove();

            debugCircleTextAnchor.enter()
                .append(SVGTags.SVGTextElement)
                .classed(LocationUnitCSS.DEBUG_TEXT + LocationUnitCSS.DEBUG_NODE, true)
                .attr(SVGAttrs.x, _ => _.x + _.radius + 0.8)
                .attr(SVGAttrs.y, _ => _.y + (_.radius / 3))
                .text(n => ` ${n.toString()} ${n.id}_debug`);

            debugCircleTextAnchor
                .attr(SVGAttrs.x, _ => _.x + _.radius + 0.8)
                .attr(SVGAttrs.y, _ => _.y + (_.radius / 3));

            debugCircleTextAnchor.exit().remove();


        }

    }

    initDebug(d3selection: AnySelection): void {
        if (!this.debugAnchor && this.debugMode)
            this.debugAnchor =
                d3selection.append<ContainerElement>(SVGTags.SVGGElement).attr(SVGAttrs.id, LocationUnitCSS.DEBUG_NODE);

    }

}

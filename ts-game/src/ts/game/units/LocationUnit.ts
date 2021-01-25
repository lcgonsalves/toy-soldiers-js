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

type ContainerElement = SVGGElement;
type LocationUnitSelection<Datum> = Selection<ContainerElement, Datum, any, any>;
type Edge = IGraphEdge<LocationUnit, LocationUnit>;

export enum css {
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

    protected shouldDisplayLabel: boolean = false;

    private _debugMode: boolean = false;

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
                this.debugAnchor = this.anchor.append<ContainerElement>(SVGTags.SVGGElement).attr(SVGAttrs.id, css.DEBUG_NODE);
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
        return `${css.EDGE_CONTAINER}_${this.name}_${this.id}`;
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

        // set attrs
        anchor.attr(SVGAttrs.id, this.id)
              .classed(this.cls, true)
              .on("mouseenter", this.applyAllHandlers(this.onMouseInHandlers))
              .on("mouseleave", this.applyAllHandlers(this.onMouseOutHandlers));

        // data join

        this.anchor = anchor.datum<LocationUnit>(this);

        // circle
        this.anchor.append<SVGCircleElement>(SVGTags.SVGCircleElement)
            .attr(SVGAttrs.cx, _ => _.x)
            .attr(SVGAttrs.cy, _ => _.y)
            .attr(SVGAttrs.r, _ => _.radius)
            .classed(css.NODE_CIRCLE, true);

        // id
        this.anchor.append<SVGTextElement>(SVGTags.SVGTextElement)
            .attr(SVGAttrs.x, node => node.x + node.radius + 1)
            .attr(SVGAttrs.y, node => node.y)
            .attr(SVGAttrs.display, this.shouldDisplayLabel ? css.INLINE : css.NONE)
            .text(node => node.id)
            .classed(css.NODE_LABEL, true)

        this.initializeDrag();

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
            .classed(css.EDGE, true)
            .append<SVGPathElement>(SVGTags.SVGPathElement) // append 1 path per group
            .classed(css.EDGEPATH, true)
            .attr(SVGAttrs.d, this.drawEdgePath.bind(this)); // draw path for the first time


        this.edgeAnchor = anchor;

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

    setDefaultDragHandlers(): void {

        const {
            config,
            worldContext
        } = this;

        this.dragStartHandlers.set(
            "default",
            function (elem: SVGGElement, evt: any) {
                select(elem).classed(css.GRABBED, true);
            });
        this.dragHandlers.set(
            "default",
            function (elem: SVGGElement, evt: any) {

                const selfRef = select<SVGGElement, LocationUnit>(elem).datum();
                const eventCoordinate: ICoordinate = new Coordinate(evt.x, evt.y);

                config.snapWhileDragging ?
                    selfRef.translateToCoord(worldContext.snap(eventCoordinate)) :
                    selfRef.translateToCoord(eventCoordinate);

            });
        this.dragEndHandlers.set(
            "default",
            function (elem: SVGGElement, evt: any) {
                select(elem).classed(css.GRABBED, false);

                const selfRef = select<SVGGElement, LocationUnit>(elem).datum();
                const eventCoordinate: ICoordinate = new Coordinate(evt.x, evt.y);

                console.log(worldContext)

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

        this.shouldDisplayLabel = true;

        this.anchor?.select("." + css.NODE_LABEL)
            .attr(SVGAttrs.display, css.INLINE);

    }

    hideLabel(): void {

        this.shouldDisplayLabel = false;

        this.anchor?.select("." + css.NODE_LABEL)
            .attr(SVGAttrs.display, css.NONE);

    }

    toggleLabel(): void {

        if (this.shouldDisplayLabel) this.hideLabel();
        else this.showLabel();

    }

    refresh(): void {

        if (this.anchor) {

            const node = this.anchor.datum(this);

            // node update
            node.select("." + css.NODE_CIRCLE)
                .attr(SVGAttrs.cx, node => node.x)
                .attr(SVGAttrs.cy, node => node.y)
                .attr(SVGAttrs.r, node => node.radius);

            node.select("." + css.NODE_LABEL)
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

            // edge update
            edges.attr(SVGAttrs.d, this.drawEdgePath.bind(this));

        }

    }

    // DEBUGGING METHODS

    renderDebugHelpers(
        points: IGraphNode[],
        lines: IGraphEdge<IGraphNode, IGraphNode>[]
    ): void {

        if (this.debugAnchor !== undefined && this.debugMode) {

            const debugPathAnchor = this.debugAnchor
                .selectAll<SVGGElement, IGraphEdge<IGraphNode, IGraphNode>>("." + css.DEBUG_EDGE)
                .data<IGraphEdge<IGraphNode, IGraphNode>>(lines, _ => _.id);

            const debugPathTextAnchor = this.debugAnchor
                .selectAll<SVGGElement, IGraphEdge<IGraphNode, IGraphNode>>("." + css.DEBUG_TEXT + css.DEBUG_EDGE)
                .data<IGraphEdge<IGraphNode, IGraphNode>>(lines, _ => _.id);

            const debugCircleAnchor = this.debugAnchor
                .selectAll<SVGGElement, IGraphNode>("." + css.DEBUG_NODE)
                .data<IGraphNode>(points, _ => _.id);

            const debugCircleTextAnchor = this.debugAnchor
                .selectAll<SVGGElement, IGraphNode>("." + css.DEBUG_TEXT + css.DEBUG_NODE)
                .data<IGraphNode>(points, _ => _.id);

            debugPathAnchor.enter()
                .append(SVGTags.SVGPathElement)
                .classed(css.DEBUG_NODE, true)
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
                .classed(css.DEBUG_TEXT + css.DEBUG_EDGE, true)
                .attr(SVGAttrs.x, _ => _.midpoint.x)
                .attr(SVGAttrs.y, _ => _.midpoint.y)
                .text(e => e.id + "_debug");

            debugPathTextAnchor
                .attr(SVGAttrs.x, _ => _.midpoint.x)
                .attr(SVGAttrs.y, _ => _.midpoint.y);

            debugPathTextAnchor.exit().remove();

            debugCircleAnchor.enter()
                .append(SVGTags.SVGCircleElement)
                .classed(css.DEBUG_NODE, true)
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
                .classed(css.DEBUG_TEXT + css.DEBUG_NODE, true)
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
                d3selection.append<ContainerElement>(SVGTags.SVGGElement).attr(SVGAttrs.id, css.DEBUG_NODE);

    }

}

/**
 * Represents a Location node in the front end.
 */
import LocationNode from "ts-shared/build/lib/graph/LocationNode";
import {Coordinate, ICoordinate} from "ts-shared/build/lib/geometry/Coordinate";
import {BaseType, select, Selection} from "d3-selection";
import SVGTags from "../../util/SVGTags";
import DrawHelpers, {AnySelection} from "../../util/DrawHelpers";
import SVGAttrs from "../../util/SVGAttrs";
import {IGraphEdge, IGraphNode} from "ts-shared/build/lib/graph/GraphInterfaces";
import {path} from "d3-path";
import {DragEvents, DragHandler, IDraggable, INodeUnit} from "./UnitInterfaces";
import {DestinationInvalidError} from "../../util/Errors";
import {drag, DragBehavior, SubjectPosition} from "d3-drag";
import {GameMapConfig} from "../map/GameMapHelpers";

type ContainerElement = SVGGElement;
type LocationUnitSelection<Datum> = Selection<ContainerElement, Datum, any, any>;
type Edge = IGraphEdge<LocationUnit, LocationUnit>;

const {
    getArcToTangentPoint,
    getCurveRadius
} = DrawHelpers;

export enum css {
    GRABBED = "grabbed",
    NODE_CIRCLE = "node_circle",
    NODE_LABEL = "node_label",
    EDGE = "node_edge",
    EDGEPATH = "node_edge_path",
    EDGE_CONTAINER = "edge_container"
}

export default class LocationUnit extends LocationNode implements INodeUnit, IDraggable {

    protected readonly name: string;
    protected anchor: LocationUnitSelection<LocationUnit> | undefined;
    protected edgeAnchor: LocationUnitSelection<Edge> | undefined;
    protected config: GameMapConfig = GameMapConfig.default
    protected readonly dragStartHandlers: Map<string, DragHandler> = new Map<string, DragHandler>();
    protected readonly dragHandlers: Map<string, DragHandler> = new Map<string, DragHandler>();
    protected readonly dragEndHandlers: Map<string, DragHandler> = new Map<string, DragHandler>();

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

        // set attrs
        anchor.attr(SVGAttrs.id, this.id)
              .classed(this.cls, true);

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
            .text(node => node.id)
            .classed(css.NODE_LABEL, true);

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
            .attr(SVGAttrs.d, e => this.drawEdgePath(e)); // draw path for the first time


        this.edgeAnchor = anchor;

    }

    /** Draws path. Path can currently dodge 1 intersecting node */
    protected drawEdgePath(e: Edge): string {
        const p = path();

        // TODO: handle more than 1 intersecting node, maybe?
        // no
        const intersectingNode = this.worldContext?.getNodesIntersecting(e)[0];
        const {from, to} = e;

        p.moveTo(from.x, from.y);

        // curve around intersecting node
        const tangentPoint = getArcToTangentPoint(e, intersectingNode, 5);
        p.arcTo(tangentPoint.x, tangentPoint.y, e.to.x, e.to.y, getCurveRadius(e, intersectingNode));

        p.lineTo(to.x, to.y);

        return p.toString();
    }

    translateToCoord(other: ICoordinate): ICoordinate {

        super.translateToCoord(other);

        if (this.anchor && this.edgeAnchor) {

            const node = this.anchor.datum(this);
            const edges = this.edgeAnchor.selectAll<SVGPathElement, Edge>(SVGTags.SVGPathElement)
                .data<Edge>(this.edges, _ => _.id);


            node.select(SVGTags.SVGCircleElement)
                .attr(SVGAttrs.cx, node => node.x)
                .attr(SVGAttrs.cy, node => node.y)
                .attr(SVGAttrs.r, node => node.radius);

            node.select(SVGTags.SVGTextElement)
                .attr(SVGAttrs.x, node => node.x + node.radius + 1)
                .attr(SVGAttrs.y, node => node.y)
                .text(node => node.id);

            edges.attr(SVGAttrs.d, this.drawEdgePath);


        }

        return this;
    }

    initializeDrag(): void {

        if (this.anchor) {

            const d = drag<any, any>();
            const {
                dragStartHandlers,
                dragHandlers,
                dragEndHandlers,
                config,
                worldContext
            } = this;

            const selfRef = this;

            // default drag handlers
            this.dragStartHandlers.set(
                "default",
                function (elem: SVGGElement, evt: any) {
                    select(elem).classed(css.GRABBED, true);
                });
            this.dragHandlers.set(
                "default",
                function (elem: SVGGElement, evt: any) {
                    // debugger
                    const eventCoordinate: ICoordinate = new Coordinate(evt.x, evt.y);
                    config.snapWhileDragging ?
                        selfRef.translateToCoord(worldContext.domain.snap(eventCoordinate)) :
                        selfRef.translateToCoord(eventCoordinate);

                });
            this.dragEndHandlers.set(
                "default",
                function (elem: SVGGElement, evt: any) {
                    select(elem).classed(css.GRABBED, false);

                    const eventCoordinate: ICoordinate = new Coordinate(evt.x, evt.y);
                    config.snapOnEnd ?
                        selfRef.translateToCoord(worldContext.domain.snap(eventCoordinate)) :
                        selfRef.translateToCoord(eventCoordinate);

                });


            d.on(DragEvents.START, function (this: SVGGElement, thisUnit: LocationUnit, coords: ICoordinate): void {

                // debugger
                dragStartHandlers.forEach((action: DragHandler) => action(this, thisUnit, coords));

            });

            d.on(DragEvents.DRAG, function (this: SVGGElement, thisUnit: LocationUnit, coords: ICoordinate): void {

                dragHandlers.forEach((action: DragHandler) => action(this, thisUnit, coords));

            });

            d.on(DragEvents.END, function (this: SVGGElement, thisUnit: LocationUnit, coords: ICoordinate): void {

                dragEndHandlers.forEach((action: DragHandler) => action(this, thisUnit, coords));

            });

            this.anchor.call(d);

        }

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


}

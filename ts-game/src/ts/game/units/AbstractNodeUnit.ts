import GameUnit from "./GameUnit";
import Node from "ts-shared/build/graph/Node";
import {EnterElement, select, Selection} from "d3-selection";
import {SVGAttrs, SVGTags} from "../../util/SVGHelper";
import {D3DragEvent, drag, DragBehavior, DraggedElementBaseType, SubjectPosition} from "d3-drag";
import DirectedGraph from "ts-shared/build/graph/DirectedGraph";
import {Interval} from "ts-shared/build/geometry/Interval";
import {GameMapConfig} from "../map/GameMapHelpers";
import {Coordinate, ICoordinate} from "ts-shared/build/geometry/Coordinate";

/**
 * Represents a graph node game unit. Can represent location, or a position. Can represent
 * players or other actors. It's abstract. I don't know what else to put down at time of writing.
 * I am tired :D
 */
export default abstract class AbstractNodeUnit<
    AssociatedNode extends Node,
    AssociatedElement extends SVGGElement = SVGGElement
    > extends GameUnit<AssociatedNode> {

    _tag = "abstract_node_unit"

    /** Defines whether drag behavior is enabled or disabled */
    private _draggable: boolean = false;
    /** D3.zoom() reference */
    protected dragBehavior: DragBehavior<AssociatedElement, AssociatedNode, SubjectPosition | AssociatedNode> | undefined;
    /** Drag configuration parameters */
    private _dragConfig: GameMapConfig | undefined;

    /** Returns associated node */
    get node(): AssociatedNode { return this.datum }


    protected constructor(
        node: AssociatedNode,
        anchor: Selection<any, AssociatedNode, any, any>,
        draggable: boolean = false,
        dragConfig: GameMapConfig | undefined = draggable ? GameMapConfig.default : undefined
    ) {
        super(
            node.id,
            node.x,
            node.y,
            node,
            anchor
        );

        this.dragBehavior = draggable ? drag<AssociatedElement, AssociatedNode>() : undefined;
        this._dragConfig = dragConfig;

        if (draggable && dragConfig && this.dragBehavior) {
            this.initializeDefaultDragBehavior();
            anchor.call(this.dragBehavior);
        }

    }

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
        this.dragBehavior?.on(event.start, this.defaultOnDragStart())
            .on(event.drag, this.defaultOnDragGrabbed())
            .on(event.drag, this.defaultOnDragEnd());

        return this.dragBehavior;
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

        return function (this: AssociatedElement, evt: any, n: AssociatedNode) {
            select(this).classed(css.grabbed, true)
        };
    }

    /**
     * Creates a callback function to NodeUnit being in the middle of a drag event. Implementations
     * must update the locations of the svg elements used in the depiction.
     *
     * @param evt {{x: number, y: number}} drag event reference, contains coordinates
     * @param dataPoint {AssociatedNode} reference to Node associated with this Unit.
     * @protected
     */
    protected abstract defaultOnDragGrabbed<E extends AssociatedElement>(): (this: AssociatedElement, evt: any, n: AssociatedNode) => void;

    /**
     * Creates a callback function to NodeUnit ending a drag event. Removes css.grabbed class by default.
     *
     * @param evt {{x: number, y: number}} drag event reference, contains coordinates
     * @param dataPoint {AssociatedNode} reference to Node associated with this Unit.
     * @protected
     */
    protected defaultOnDragEnd<E extends AssociatedElement>(): (this: AssociatedElement, evt: any, n: AssociatedNode) => void {
        // use this space to access the "this" context -- thanks d3

        return function (this: AssociatedElement, evt: any, n: AssociatedNode) {
            select(this).classed(css.grabbed, true)
        };
    }

    protected get dragConfig(): GameMapConfig | undefined {
        return this._dragConfig;
    }

    /** Generates a drag function for a given Node element, with default handlers pre-assigned
     * custom handlers can be passed to append behaviour to the end of the default handlers.
     * This is necessary to tie actions to react state. */
    public static NodeDragBehavior<E extends DraggedElementBaseType, N extends Node>(
        onStart: (elem: E, evt: D3DragEvent<E, N, any>, dataPoint: N) => void,
        onDrag: (elem: E, evt: D3DragEvent<E, N, any>, dataPoint: N) => void,
        onEnd: (elem: E, evt: D3DragEvent<E, N, any>, dataPoint: N) => void,
        config: GameMapConfig = GameMapConfig.default
    ): DragBehavior<E, N, SubjectPosition | N> {

        const {step, snapRadius} = config;

        // sets node to active
        function defaultOnStart(this: E, evt: any, dataPoint: N) {
            select(this).classed(css.grabbed, true);
            onStart(this, evt, dataPoint);
        }

        // changes the element's location
        function defaultOnDrag(this: E, evt: any, dataPoint: N) {
            let {x, y} = evt;

            const snap = (coordinate: ICoordinate, config: GameMapConfig): ICoordinate => {
                let {x,y} = coordinate;
                const {step, snapRadius} = config;
                const snapCore = DirectedGraph.snapToGrid(x, y);
                const fractionOfStep = step * snapRadius;
                const snapZone = {
                    x: new Interval(snapCore.x - fractionOfStep, snapCore.x + fractionOfStep),
                    y: new Interval(snapCore.y - fractionOfStep, snapCore.y + fractionOfStep)
                };

                x = snapZone.x.contains(x) ? snapCore.x : x;
                y = snapZone.y.contains(y) ? snapCore.y : y;
                return new Coordinate(x,y);
            }

            snap(new Coordinate(x,y), config);

            select(this)
                .selectAll("circle")
                .attr("cx", x)
                .attr("cy", y);

            select(this)
                .selectAll("text")
                .attr("x", x + dataPoint.radius + 1)
                .attr("y", y);

            onDrag(this, evt, dataPoint);

        }

        // deactivates node, updates real value
        function defaultOnEnd(this: E, evt: any, coordinate: N) {
            const {x, y} = DirectedGraph.snapToGrid(evt.x, evt.y)

            select(this).classed("grabbed", false);
            coordinate.moveTo(x, y);

            onEnd(this, evt, coordinate);

        }

        return drag<E, N>()
            .on("start", defaultOnStart)
            .on("drag", defaultOnDrag)
            .on("end", defaultOnEnd);

    }

}

const enum css {
    grabbed = "grabbed"
}

// supported events
enum event {
    start = "start",
    drag = "drag",
    end = "end"
}

import Node from "ts-shared/build/graph/Node";
import {Selection} from "d3-selection";
import AbstractNodeUnit, {css, msg} from "./AbstractNodeUnit";
import SVGAttrs from "../../util/SVGAttrs";
import SVGTags from "../../util/SVGTags";
import {GameMapConfig} from "../map/GameMapHelpers";
import DirectedEdge from "ts-shared/build/graph/DirectedEdge";
import DirectedGraph from "ts-shared/build/graph/DirectedGraph";

export default class LocationNodeUnit<N extends Node = Node> extends AbstractNodeUnit<N> {

    constructor(
        node: N,
        graph: DirectedGraph,
        anchor: Selection<any, N, any, any>,
        draggable: boolean = false,
        dragConfig: GameMapConfig | undefined = draggable ? GameMapConfig.default : undefined
    ) {
        const tag = "location_node_unit";

        super(node, graph, anchor, draggable, dragConfig, tag);

    }

    protected renderDepiction(): void {
        const s = this.current;

        // circle
        s.append<SVGCircleElement>(SVGTags.SVGCircleElement)
            .attr(SVGAttrs.cx, node => node.x)
            .attr(SVGAttrs.cy, node => node.y)
            .attr(SVGAttrs.r, node => node.radius)
            .classed(css.NODE_CIRCLE, true);

        // id
        s.append<SVGTextElement>(SVGTags.SVGTextElement)
            .attr(SVGAttrs.x, node => node.x + node.radius + 1)
            .attr(SVGAttrs.y, node => node.y)
            .text(node => node.id)
            .classed(css.NODE_LABEL, true);

        this.renderEdgeDepiction();
    }

    protected removeDepiction(): void {

        this.removeEdgeDepiction();

        this.current.remove();

    }

    protected updateDepiction(): void {
        const s = this.current;

        s.select(SVGTags.SVGCircleElement)
            .attr(SVGAttrs.cx, node => node.x)
            .attr(SVGAttrs.cy, node => node.y)
            .attr(SVGAttrs.r, node => node.radius);

        s.select(SVGTags.SVGTextElement)
            .attr(SVGAttrs.x, node => node.x + node.radius + 1)
            .attr(SVGAttrs.y, node => node.y)
            .text(node => node.id);

        this.updateEdgeDepiction();


    }

    protected renderEdgeDepiction() {

        this.edgeSelection
            .selectAll<SVGGElement, DirectedEdge>(SVGTags.SVGPathElement)
            .data<DirectedEdge>(this.datum.edges, _ => _.id)
            .enter()
            .append<SVGGElement>(SVGTags.SVGGElement) // select and append 1 group per edge
            .classed(css.EDGE, true)
            .append<SVGPathElement>(SVGTags.SVGPathElement) // append 1 path per group
            .classed(css.EDGEPATH, true)
            .attr(SVGAttrs.d, e => this.drawEdgePath(e)); // draw path for the first time

    }

    protected removeEdgeDepiction() {

        this.currentEdgeGroupSelection.exit().remove();

    }

    protected updateEdgeDepiction() {

        this.currentEdgePathSelection.attr(SVGAttrs.d, e => this.drawEdgePath(e));

    }

}

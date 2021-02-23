import {LocationContext} from "ts-shared/build/lib/mechanics/Location";
import {C, Coordinate, ICoordinate} from "ts-shared/build/lib/geometry/Coordinate";
import {pointer, select} from "d3-selection";
import SVGAttrs from "../../../util/SVGAttrs";
import SVGTags from "../../../util/SVGTags";
import {zoom} from "d3-zoom";
import {path, Path} from "d3-path";
import LocationUnit from "../../units/LocationUnit";
import {AnySelection, defaultColors} from "../../../util/DrawHelpers";
import Dock from "./Dock";
import {action, ActionTooltip, GenericAction, TargetAction} from "./Tooltip";
import LocationNode from "ts-shared/build/lib/graph/LocationNode";
import { act } from "react-dom/test-utils";
import {log} from "util";
import {Events} from "../../../util/Events";

interface MapEditorMapConfig {
    backgroundColor: string;
    foregroundColor: string;
    gridStroke: string;
    zoomBuffer: number;
}

interface NodeAction {
    key: string,
    apply: (n: LocationUnit) => void
}

enum MapEditorControllerCSS {
    BG_ELEM = "bg_elememnt",
    MAIN_ELEM = "main_element",
    BOTTOM_MENU = "bottom_menu",
    TOOLTIP = "tooltip",
    GRID_ID = "grid_element",
    GRID_CLS = "grid",
    NODE_CONTAINER_ID = "nodes",
    NODE_CONTAINER_CLS = "node",
    POINTER_EVENTS = "none",
    EDGE_CONTAINER_ID = "edges",
    GAME_UNIT_BOX = "game_unit_box",
    TOOLTIP_ACTION_BUTTON = "tooltip_action_button"
}

/**
 * Basically tracks and renders contexts in the svg.
 * AKA: dumping zone for stuff I have no clue where should be defined.
 */
export class MapEditorController {
    // contexts
    public readonly locations: LocationContext<LocationUnit>;
    public readonly dock: Dock<LocationUnit> = new Dock("Map Elements");

    // anchors
    private readonly edgeContainer: AnySelection;
    private readonly nodeContainer: AnySelection;
    private readonly mainGroup: AnySelection;
    private readonly bgGroup: AnySelection;

    private readonly zoomHandlers: Map<string, (scale: number, x: number, y: number) => void> = new Map<string, (scale: number, x: number, y: number) => void>();

    // tooltip reference
    private readonly actionTooltip: ActionTooltip = new ActionTooltip();

    // putting all of the boilerplate in here
    constructor(nodeContext: LocationContext<LocationUnit>, anchor: SVGSVGElement, config: MapEditorMapConfig) {
        this.locations = nodeContext;

        const gridCoords = {
            topL: new Coordinate(nodeContext.domain.x.min, nodeContext.domain.y.min),
            topR: new Coordinate(nodeContext.domain.x.max, nodeContext.domain.y.min),
            bottomL: new Coordinate(nodeContext.domain.x.min, nodeContext.domain.y.max),
            bottomR: new Coordinate(nodeContext.domain.x.max, nodeContext.domain.y.max)
        }

        // defines extents of background
        const bgCoords = {
            topL: new Coordinate(gridCoords.topL.x - 150, gridCoords.topL.y - 150),
            topR: new Coordinate(gridCoords.topR.x + 150, gridCoords.topR.y - 150),
            bottomL: new Coordinate(gridCoords.bottomL.x - 150, gridCoords.bottomL.y + 150),
            bottomR: new Coordinate(gridCoords.bottomR.x + 150, gridCoords.bottomR.y + 150)
        };

        // background for event tracking
        const backgroundElement = select(anchor)
            .append(SVGTags.SVGGElement)
            .classed(MapEditorControllerCSS.BG_ELEM, true)
            .append(SVGTags.SVGRectElement)
            .attr(SVGAttrs.x, bgCoords.topL.x)
            .attr(SVGAttrs.y, bgCoords.topL.y)
            .attr(SVGAttrs.width, bgCoords.topL.distance(bgCoords.topR))
            .attr(SVGAttrs.height, bgCoords.topL.distance(bgCoords.bottomL))
            .attr(SVGAttrs.fill, config.backgroundColor);

        this.bgGroup = backgroundElement;

        const mainGroup = select(anchor)
            .append(SVGTags.SVGGElement)
            .classed(MapEditorControllerCSS.MAIN_ELEM, true);

        this.mainGroup = mainGroup;

        // init zoom
        backgroundElement.call(
            zoom<any, unknown>()
                .scaleExtent([0.5, 2])
                .translateExtent([
                    [bgCoords.topL.x - config.zoomBuffer, bgCoords.topL.y - config.zoomBuffer],
                    [bgCoords.bottomR.x + config.zoomBuffer, bgCoords.bottomR.y + config.zoomBuffer]
                ])
                .on("zoom", (event: any) => {
                    mainGroup.attr("transform", event.transform.toString());

                    for (let handler of this.zoomHandlers.values()) {
                        handler(event.transform.k, event.transform.x, event.transform.y);
                    }

                })
        );

        // draw grid
        const gridGroup = mainGroup.append(SVGTags.SVGGElement)
            .attr(SVGAttrs.id, MapEditorControllerCSS.GRID_ID)
            .attr(SVGAttrs.pointerEvents, MapEditorControllerCSS.POINTER_EVENTS);

        // draw background
        gridGroup.append(SVGTags.SVGRectElement)
            .attr(SVGAttrs.x, gridCoords.topL.x)
            .attr(SVGAttrs.y, gridCoords.topL.y)
            .attr(SVGAttrs.height, gridCoords.topL.distance(gridCoords.bottomL))
            .attr(SVGAttrs.width, gridCoords.topL.distance(gridCoords.topR))
            .attr(SVGAttrs.fill, config.foregroundColor);

        const drawGrid = (context: Path): Path => {
            const xDomain = this.locations.domain.x,
                yDomain = this.locations.domain.y;

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

        gridGroup.append(SVGTags.SVGPathElement)
            .classed(MapEditorControllerCSS.GRID_CLS, true)
            .attr(SVGAttrs.d, drawGrid(path()).toString());


        // append edges svg group first to respect rendering order
        this.edgeContainer = mainGroup.append(SVGTags.SVGGElement)
            .attr(SVGAttrs.id, MapEditorControllerCSS.EDGE_CONTAINER_ID);

        // append nodes svg group
        this.nodeContainer = mainGroup.append(SVGTags.SVGGElement)
            .attr(SVGAttrs.id, MapEditorControllerCSS.NODE_CONTAINER_ID)
            .classed(MapEditorControllerCSS.NODE_CONTAINER_CLS, true);

        
        // instantiate tooltip
        this.initializeTooltip(anchor);

        // append and instantiate all elements of the bottom menu
        this.initBottomMenu(anchor);

        // attach nodes already in context to group
        nodeContext.nodes.forEach(n => this.initializeLocationNode(n));
        
    }

    /** Constructs and mounts bottom menu */
    private initBottomMenu(anchor: SVGSVGElement): void {

        const {dock} = this;
        dock.register(
            "Basic Location Node A",
            "A simple node signifying a location in the x-y plane.",
            (x: number, y: number, id: string, name: string) => new LocationUnit(name, id, C(x, y), 6)
        );

        dock.register(
            "Basic Location Node B",
            "A simple node signifying a location in the x-y plane.",
            (x: number, y: number, id: string, name: string) => new LocationUnit(name, id, C(x, y), 2)
        );

        dock.register(
            "Basic Location Node C",
            "A simple node signifying a location in the x-y plane.",
            (x: number, y: number, id: string, name: string) => new LocationUnit(name, id, C(x, y), 12)
        );

        dock.attachDepictionTo(select(anchor));

        dock.onNodePlacement = (node: LocationUnit) => {
            this.locations.add(node);
        
            // reverse transforms to place node in correct coordinate
            const g: SVGGElement = this.mainGroup.node();
            const hasTransforms = g.transform.baseVal.numberOfItems === 2;
            const translation: {
                x: number,
                y: number
            } = hasTransforms ? {
                x: g.transform.baseVal.getItem(0).matrix.e,
                y: g.transform.baseVal.getItem(0).matrix.f
            } : {
                x: 0,
                y: 0
            };
            const scale: number = hasTransforms ? g.transform.baseVal.getItem(1).matrix.a : 1;
        
            console.log(node.toString());
            
            node.translateBy(-(translation.x), -(translation.y));
            node.translateTo(node.x / scale, node.y / scale);
        
            this.initializeLocationNode(node);
        
        };

    }

    /** attaches depictions, and associates handlers to toggle lable and refresh edge endpoints */
    private initializeLocationNode<Unit extends LocationUnit>(n: Unit): void {

        // attach depictions
        n.attachDepictionTo(this.nodeContainer);
        n.attachEdgeDepictionTo(this.edgeContainer);
        n.shouldDisplayLabel = false;

        const refreshEndpoints = action("refresh_endpoints", "refresh_endpoints", () => {
                this.locations.nodes.forEach(nodeInContext => {
                    if (!nodeInContext.equals(n) && nodeInContext.isAdjacent(n)) nodeInContext.refreshEdgeDepiction(true);

                });
            }
        );

                // detect when nodes move and react to it
        n.onDrag(refreshEndpoints.key, refreshEndpoints.apply);
        n.onDragEnd(refreshEndpoints.key, refreshEndpoints.apply);
        

        // allowed actions upon every node
        const connectToAction = action<Unit>("connect", "connect", node => {

            // create virtual node
            const mouseTrackerNodeID = "tracker";
            const mouseTrackerNode = new LocationNode(mouseTrackerNodeID, 1, node.x, node.y);



            // connect to it
            node.connectTo(mouseTrackerNode);

            // make background track mouse movement and update node location


            // attach a listener to this node to detect clicks.
            // clicking on this node should create a connection
            // callback function should undo everything.
            const hook = new TargetAction<LocationNode>("hook", "hook", (n) => {

                n.connectTo(node);
                allLocations.forEach(_ => {
                    _.removeOnMouseClick(hook.key);
                    _.draggable = true;
                });
                this.bgGroup?.on(Events.mousemove, null);
                node.disconnectFrom(mouseTrackerNode);

            });

            // prepare nodes for connection
            const allLocations = this.locations.all();
            allLocations.forEach(l => {

                // now they are listening for that sweet sweet click
                l.onMouseClick(hook.key, () => hook.apply(l));

                // now they stop being draggable
                l.draggable = false;

            });


            this.bgGroup?.on(Events.mousemove, function(evt: any) {

                const [x, y] = pointer(evt);
                const eventCoordinate = C(x, y);
                console.log(node.toString(), eventCoordinate.toString());

                // magnet zone
                const magnetZone = 5;

                const closestNeighbor = allLocations.find(l => l.distance(node) <= magnetZone);

                (closestNeighbor) ? mouseTrackerNode.translateToCoord(closestNeighbor) : mouseTrackerNode.translateToCoord(eventCoordinate);
                node.refreshEdgeDepiction();

            });

            // at each step, get nodes in vicinity (which by the way needs to cache by closest location to save some performance)
            // within a bound (say 5 units)  lockstep node position to the position of the closest node in the vicinity of the mouse

        });

        connectToAction.depiction = TargetAction.depiction.main

        const removeAction = action<Unit>("remove", "remove", node => {
            n.deleteDepiction();
            this.locations.rm(node.id);
            this.actionTooltip.unfocus(0);
            this.locations.getNodesAdjacentTo(node).forEach(unit => {
                unit.disconnectFrom(node, true);
                unit.refreshEdgeDepiction();
            });
        });
        removeAction.depiction = TargetAction.depiction.delete;

        // display tooltip on hover
        n.onMouseIn("display_tooltip", () => {
            this.actionTooltip.focus(
                n,
                [removeAction, connectToAction],
                n.coordinate.translateBy(0, -n.radius),
                670
            )
        });
        n.onMouseOut("hide_tooltip", () => this.actionTooltip.unfocus(250, true))

    }

    /** instantiates the tooltip */
    private initializeTooltip(anchor: SVGSVGElement): void {

        const {actionTooltip} = this;

        // attach depiction so tooltip shows up
        actionTooltip.attachDepictionTo(select(anchor));

        // associate context so the tooltip knows how to correct its position
        actionTooltip.setContext(this.mainGroup);

    }
    
}

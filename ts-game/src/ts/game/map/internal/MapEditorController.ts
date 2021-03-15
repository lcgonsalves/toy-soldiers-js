import {pointer, select} from "d3-selection";
import SVGAttrs from "../../../util/SVGAttrs";
import SVGTags from "../../../util/SVGTags";
import {zoom} from "d3-zoom";
import {path, Path} from "d3-path";
import {AnySelection, getTransforms} from "../../../util/DrawHelpers";
import Dock from "./Dock";
import {ActionTooltip} from "./Tooltip";
import {Events} from "../../../util/Events";
import {C, Coordinate, ICoordinate} from "ts-shared/build/geometry/Coordinate";
import LocationNode from "ts-shared/build/graph/LocationNode";
import {TAction, TargetAction} from "../../../util/Action";
import {LocationContext} from "ts-shared/build/mechanics/Location";
import LocationUnit from "../../units/LocationUnit";
import BaseUnit from "../../units/BaseUnit";
import {IDepictable} from "../../units/UnitInterfaces";
import {BaseContext} from "ts-shared/build/mechanics/Base";

interface MapEditorMapConfig {
    backgroundColor: string;
    foregroundColor: string;
    gridStroke: string;
    zoomBuffer: number;
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

    // valid locations on the map for things to exist
    public readonly locations: LocationContext<LocationUnit> = new LocationContext<LocationUnit>(15, 300, 300);

    // context where bases exist
    public readonly bases: BaseContext<BaseUnit> = new BaseContext<BaseUnit>(this.locations);

    // REGISTER ITEMS INTO DOCK //

    /** ADD ACCEPTED TYPES HERE WHEN REGISTERING NEW ITEMS */
    public readonly dock: Dock<
        LocationUnit |
        BaseUnit
    > = new Dock("Map Elements");

    // anchors
    private readonly edgeContainer: AnySelection;
    private readonly nodeContainer: AnySelection;
    private readonly mainGroup: AnySelection;
    private readonly bgGroup: AnySelection;

    // tooltip reference
    private readonly actionTooltip: ActionTooltip = new ActionTooltip();

    // putting all of the boilerplate in here
    constructor(anchor: SVGSVGElement, config: MapEditorMapConfig) {

        const gridCoords = {
            topL: new Coordinate(this.locations.domain.x.min, this.locations.domain.y.min),
            topR: new Coordinate(this.locations.domain.x.max, this.locations.domain.y.min),
            bottomL: new Coordinate(this.locations.domain.x.min, this.locations.domain.y.max),
            bottomR: new Coordinate(this.locations.domain.x.max, this.locations.domain.y.max)
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

        const mainGroup = select<SVGGElement, undefined>(anchor)
            .append(SVGTags.SVGGElement)
            .classed(MapEditorControllerCSS.MAIN_ELEM, true);

        this.mainGroup = mainGroup;

        // init zoom
        select("." + MapEditorControllerCSS.BG_ELEM).call(
            zoom<any, unknown>()
                .scaleExtent([0.25, 2])
                .translateExtent([
                    [bgCoords.topL.x - config.zoomBuffer, bgCoords.topL.y - config.zoomBuffer],
                    [bgCoords.bottomR.x + config.zoomBuffer, bgCoords.bottomR.y + config.zoomBuffer]
                ])
                .on("zoom", (event: any) => {
                    mainGroup.attr("transform", event.transform.toString());
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
        this.locations.nodes.forEach(n => this.initializeLocationNode(n));
        
    }

    private undoTransform(n: IDepictable & ICoordinate) {

        // reverse transforms to place node in correct coordinate
        const {
            translation,
            scale
        } = getTransforms(this.mainGroup);

        n.translateTo(
            ((n.x / scale) - (translation.x / scale)),
            ((n.y / scale) - (translation.y / scale))
        );

        // attach depictions
        n.attachDepictionTo(this.nodeContainer);

    }

    /** Constructs and mounts bottom menu */
    private initBottomMenu(anchor: SVGSVGElement): void {

        // REGISTER ITEMS INTO DOCK //

        // ## construct function, name and title
        const {dock} = this;
        dock.register(
            "BuildableLocation",
            "A simple node signifying a location in the x-y plane.",
            (x: number, y: number, id: string, name: string) => new LocationUnit(id, C(x, y), name),
            // location units can be placed anywhere
            () => true
        );

        dock.register(
            "TestBase",
            "A  base where pawns can occupy.",
            (x: number, y: number, id: string, name: string) => {
                const b = new BaseUnit(id, C(x, y), name)

                return b;
            },
            // base units can be placed only on top of unoccupied location units
            (base) => {
                const step = this.locations.domain.x.step;

                return this.locations.getNodesInVicinity(base.unscaledPosition(this.mainGroup), step).length > 0 &&
                    !this.bases.getNodesInVicinity(base.unscaledPosition(this.mainGroup), step).length;
            }
        );

        dock.attachDepictionTo(select(anchor));

        dock.onNodePlacement((node) => {

            // REGISTER ITEMS INTO DOCK //
            this.undoTransform(node);

            if (node instanceof LocationUnit) this.initializeLocationNode(node);
            if (node instanceof BaseUnit) this.initializeBaseNode(node);

        });

    }

    /** attaches depictions, and associates handlers to toggle lable and refresh edge endpoints */
    private initializeLocationNode<Unit extends LocationUnit>(n: Unit): void {

        this.locations.add(n);
        n.snapSelf();

        const refreshEndpoints = TAction("refresh_endpoints", "refresh_endpoints", () => {
                this.locations.nodes.forEach(nodeInContext => {
                    if (!nodeInContext.equals(n) && nodeInContext.isAdjacent(n)) {}
                        // nodeInContext.refreshEdgeDepiction();

                });
            });

        // detect when nodes move and react to it
        n.onDrag(refreshEndpoints.apply);
        n.onDragEnd(refreshEndpoints.apply);
        

        // allowed actions upon every node

        // moves into connecting state, tracking a virtual node until either the esc key is pressed,
        // or the user clicks on a node, or the user clicks somewhere in the map.
        const connectToAction = TAction<Unit>("connect", "connect", node => {

            // create virtual node
            const mouseTrackerNodeID = "tracker";
            const mouseTrackerNode = new LocationUnit(mouseTrackerNodeID, node);

            // connect to it
            node.connectTo(mouseTrackerNode);

            // disable tooltip to not create a mess
            this.actionTooltip.enabled = false;
            this.actionTooltip.unfocus();

            // make this node undraggable
            // node.draggable = false;

            // make background track mouse movement and update node location

            // attach a listener to this node to detect clicks.
            // clicking on this node should create a connection
            // callback function should undo everything.
            const hook = new TargetAction<LocationNode>("hook", "hook", (n) => {

                node.connectTo(n, true);

                allLocations.forEach(_ => {
                    // _.removeOnMouseClick(hook.key);
                    // _.draggable = true;
                });
                // node.draggable = true;

                this.bgGroup?.on(Events.mousemove, null);
                node.disconnectFrom(mouseTrackerNode);
                select("body").on(Events.keydown, null);
                this.actionTooltip.enabled = true;


            });

            // prepare nodes for connection
            const allLocations = this.locations.all().filter(l => !l.overlaps(node));
            allLocations.forEach(l => {

                // now they are listening for that sweet sweet click
                // l.onMouseClick(hook.key, () => hook.apply(l));

                // now they stop being draggable
                // l.draggable = false;

            });


            this.bgGroup?.on(Events.mousemove, function(evt: any) {

                const [x, y] = pointer(evt);
                const eventCoordinate = C(x, y);

                // magnet zone
                const magnetZone = 5;
                const closestNeighbor = allLocations.find(l => l.distance(eventCoordinate) <= magnetZone);
                closestNeighbor !== undefined ? mouseTrackerNode.translateToCoord(closestNeighbor) : mouseTrackerNode.translateToCoord(eventCoordinate);

                // node.refreshEdgeDepiction();

            });

            // listen for esc press, stop all when pressed
            select("body").on(Events.keydown, e => {
                if (e.code === "Escape") {

                    allLocations.forEach(_ => {
                        // _.removeOnMouseClick(hook.key);
                        // _.draggable = true;
                    });
                    // node.draggable = true;

                    this.bgGroup?.on(Events.mousemove, null);
                    node.disconnectFrom(mouseTrackerNode);
                    select("body").on(Events.keydown, null);
                    this.actionTooltip.enabled = true;

                }
            });

        });
        connectToAction.depiction = TargetAction.depiction.neutral

        const removeAction = TAction<Unit>("remove", "remove", node => {
            this.locations.rm(node.id);
            this.actionTooltip.unfocus(0);
            this.locations.getNodesAdjacentTo(node).forEach(adj => {
                node.disconnectFrom(adj, true);
                console.log(adj.adjacent);
                // adj.refreshEdgeDepiction();
            });

            node.deleteDepiction();

        });
        removeAction.depiction = TargetAction.depiction.delete;

        const disconnectFromAction = TAction<Unit>("disconnect", "disconnect", node => {
            // build a new action for each adjacent node
            const newActions = node.adjacent.map((adjNode) => {
                const actionName = "dc_" + adjNode.id;

                return TAction<LocationUnit>(
                    actionName,
                    actionName,
                    () => {

                        // because we do want the line to disappear, otherwise it looks weird
                        node.disconnectFrom(adjNode, true);

                        // also remove the button
                        this.actionTooltip.removeAction(actionName);

                    },
                    {
                        start: () => {
                            // adjNode.toggleHighlight();
                            console.log("highlight on " + adjNode.toString())
                        },
                        stop: () => {
                            // adjNode.toggleHighlight()
                            console.log("highlight off " + adjNode.toString())
                        }
                    });

            });

            this.actionTooltip.setActions<Unit>(newActions, node, 0);

        });
        disconnectFromAction.depiction = TargetAction.depiction.neutral;

        const actionsForLooseNodes = [connectToAction, removeAction];

        // display tooltip on hover
        // n.onMouseIn("display_tooltip", () => {
        //     const hasNeighbors = n.adjacent.length > 0;
        //
        //     this.actionTooltip.focus(
        //         n,
        //         hasNeighbors ? [connectToAction, disconnectFromAction, removeAction] : actionsForLooseNodes,
        //         n.coordinate.translateBy(0, -n.radius),
        //         670
        //     )
        // });
        // n.onMouseOut("hide_tooltip", () => this.actionTooltip.unfocus(250, true));

        n.onDragStart(() => {
            this.actionTooltip.enabled = false;
            this.actionTooltip.unfocus(0, true);
        });
        n.onDragEnd(() => {
            this.actionTooltip.enabled = true;
        });

    }

    private initializeBaseNode<Base extends BaseUnit>(b: Base): void {

        this.bases.add(b);
        b.snapSelf();

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

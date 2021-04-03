import {select} from "d3-selection";
import SVGAttrs from "../../../util/SVGAttrs";
import SVGTags from "../../../util/SVGTags";
import {zoom} from "d3-zoom";
import {path, Path} from "d3-path";
import {AnySelection, getTransforms} from "../../../util/DrawHelpers";
import Dock from "./Dock";
import {ActionTooltip} from "./Tooltip";
import {C, Coordinate, ICoordinate} from "ts-shared/build/geometry/Coordinate";
import {LocationContext} from "ts-shared/build/mechanics/Location";
import LocationUnit from "../../units/LocationUnit";
import BaseUnit from "../../units/BaseUnit";
import {IDepictable, Sprite} from "../../units/mixins/Depictable";
import {BaseContext} from "ts-shared/build/mechanics/Base";
import {merge, Subscription} from "rxjs";
import {IGraphNode} from "ts-shared/build/graph/GraphInterfaces";
import EMap from "ts-shared/build/util/EMap";
import {RoadUnit, RoadUnitCSS} from "../../units/RoadUnit";

interface MapEditorMapConfig {
    backgroundColor: string;
    foregroundColor: string;
    gridStroke: string;
    zoomBuffer: number;
}

enum MapEditorControllerCSS {
    BG_ELEM = "bg_elememnt",
    MAIN_ELEM = "main_element",
    GRID_ID = "grid_element",
    GRID_CLS = "grid",
    NODE_CONTAINER_ID = "nodes",
    NODE_CONTAINER_CLS = "node",
    POINTER_EVENTS = "none",
    EDGE_CONTAINER_ID = "edges",
    LOCATIONS_CONTAINER_CLS = "locations",
    BASES_CONTAINER_CLS = "locations"
}

/**
 * Basically tracks and renders contexts in the svg.
 * AKA: dumping zone for stuff I have no clue where should be defined.
 */
export class MapEditorController {

    // valid locations on the map for things to exist
    public readonly locations: LocationContext<LocationUnit> = new LocationContext<LocationUnit>(15, 300, 300);

    // context where bases exist
    public readonly bases: BaseContext<BaseUnit, LocationUnit> = new BaseContext<BaseUnit, LocationUnit>(this.locations);

    // keep track of all connections between graph nodes - maps source of road to destination of road
    public readonly roads: EMap<IGraphNode, RoadUnit[]> = new EMap<IGraphNode, RoadUnit[]>(x => x.id);

    // for internal reactive management
    private subscriptions: Map<string, Subscription[]> = new Map<string, Subscription[]>();

    // REGISTER ITEMS INTO DOCK //

    /** ADD ACCEPTED TYPES HERE WHEN REGISTERING NEW ITEMS */
    public readonly dock: Dock<
        LocationUnit |
        BaseUnit
    > = new Dock("Map Elements");

    // anchors
    private readonly roadContainer: AnySelection;
    private readonly mainGroup: AnySelection;
    private readonly locationGroup: AnySelection;
    private readonly baseGroup: AnySelection;
    private readonly bgGroup: AnySelection;

    // tooltip reference
    private readonly actionTooltip: ActionTooltip = new ActionTooltip();

    // putting all of the boilerplate in here
    constructor(anchor: SVGSVGElement, config: MapEditorMapConfig) {

        // watch for node removals and perform cleanup
        merge<LocationUnit[], BaseUnit[]>(this.locations.$rm, this.bases.$rm)
            .subscribe((removedUnits: Array<LocationUnit | BaseUnit>) => {
                removedUnits.forEach(unit => {

                    // unsubscribe
                    this.subscriptions.get(unit.id + unit.key)?.forEach(_ => _.unsubscribe());

                    // clear all roads

                });
            });

        // watch for node additions and snap them
        this.locations.onAdd((locations) => locations.forEach(_ => this.locations.snap(_)));
        this.bases.onAdd((bases) => bases.forEach(_ => this.bases.snap(_)));

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
                    this.actionTooltip.unfocus();
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
        this.roadContainer = mainGroup.append(SVGTags.SVGGElement)
            .attr(SVGAttrs.id, MapEditorControllerCSS.EDGE_CONTAINER_ID);

        this.locationGroup = mainGroup.append(SVGTags.SVGGElement).classed(MapEditorControllerCSS.LOCATIONS_CONTAINER_CLS, true);
        this.baseGroup     = mainGroup.append(SVGTags.SVGGElement).classed(MapEditorControllerCSS.BASES_CONTAINER_CLS, true);

        
        // instantiate tooltip
        this.initializeTooltip(anchor);

        // append and instantiate all elements of the bottom menu
        this.initBottomMenu(anchor);

        // attach nodes already in context to group
        this.locations.nodes.forEach((id, n) => this.initializeLocationNode(n));
        
    }

    /**
     * For a given IGraphNode ID, register the passed subscriptions. If the ID has already
     * subscriptions registed, it will append. Otherwise it will set the map to the values.
     * @param id
     * @param s
     */
    registerSubscription(id: string, ...s: Subscription[]): void {
        if (this.subscriptions.has(id)) {
            this.subscriptions.get(id)?.push(...s);
        } else this.subscriptions.set(id, s);
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

    }

    /** Constructs and mounts bottom menu */
    private initBottomMenu(anchor: SVGSVGElement): void {

        // REGISTER ITEMS INTO DOCK //

        // ## construct function, name and title
        const {dock} = this;
        dock.register(
            "Buildable Location",
            "A simple node signifying a location in the x-y plane.",
            (x: number, y: number, id: string, name: string) => new LocationUnit(id, C(x, y), name),
            // location units can be placed anywhere
            () => true
        );

        dock.register(
            "Test Base",
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
        this.locations.snap(n)
        n.attachDepictionTo(this.locationGroup);

        // snap on end of drag
        this.registerSubscription(n.id + n.key, n.onDragEnd(() => this.locations.snap(n)));



    }

    private initializeBaseNode<B extends BaseUnit>(b: B): void {

        this.bases.add(b);
        b.attachDepictionTo(this.baseGroup);

        this.registerSubscription(b.id + b.key, b.onDragEnd(() => this.bases.snap(b)))

        const bg = this.bgGroup;


        // listen for hovers
        this.registerSubscription(
            b.id + b.key,
            b.onMouseEnter(e => {

                this.actionTooltip.focus(e.target, b.getActions(
                    bg,
                    this.actionTooltip,
                    this.locations,
                    this.bases,
                    e.focus,
                    (from, to, toSocket?: ICoordinate) => this.addRoad(from, to, e.focus, toSocket)
                ), e.focus, 150)
            }),
            b.onMouseLeave(() => this.actionTooltip.unfocus(250)),
            b.onDragStart(() => this.actionTooltip.unfocus(0))
        );

    }

    /** instantiates the tooltip */
    private initializeTooltip(anchor: SVGSVGElement): void {

        const {actionTooltip} = this;

        // attach depiction so tooltip shows up
        actionTooltip.attachDepictionTo(select(anchor));

        // associate context so the tooltip knows how to correct its position
        actionTooltip.setContext(this.mainGroup);

    }

    /**
     * Keeps track of road connection, and attaches depiction for that road. Road depiction will update
     * upon position changes of either node.
     * @param from
     * @param to
     * @private
     */
    private addRoad(from: IGraphNode, to: IGraphNode, fromSocket?: ICoordinate, toSocket?: ICoordinate): void {

        const roads = this.roads.getValue(from);
        const r = new RoadUnit(from, to, fromSocket, toSocket);

        // only add if road doesn't yet exist
        if (roads && roads.findIndex(r => r.destination.equals(to)) === -1) {

            // update
            this.roads.setValue(from, [...roads, r]);
            r.attachDepictionTo(this.roadContainer);

        } if (!roads) {

            // and create array if it's not
            this.roads.setValue(from, [r]);
            r.attachDepictionTo(this.roadContainer);

        }

    }

    /**
     * Removes road connecting 'from' and 'to' nodes. If 'to' node isn't specified, all connections
     * stemming from 'from' node will be removed. Depictions are cleaned up as well.
     * @param from
     * @param to
     * @private
     */
    private rmRoad(from: IGraphNode, to?: IGraphNode): void {

    }
    
}

import { AnySelection, defaultConfigurations, DockConfig, rect } from "../../../util/DrawHelpers";
import { IDepictable } from "../../units/mixins/Depictable";
import SVGTags from "../../../util/SVGTags";
import SVGAttrs from "../../../util/SVGAttrs";
import { path } from "d3";
import {ICoordinate} from "ts-shared/build/geometry/Coordinate";
import Rectangle from "ts-shared/build/geometry/Rectangle";
import {LocationContext} from "ts-shared/build/mechanics/Location";
import LocationNode from "ts-shared/build/graph/LocationNode";
import {IScalable} from "../../units/mixins/Scalable";
import {Subject, Subscription} from "rxjs";
import {isDraggable} from "../../units/mixins/Draggable";


type UnitConstructor<Unit> = (x: number, y: number, id: string, name: string) => Unit

enum DockCSS {
    MAIN_CONTAINER_CLS = "menu_main_container",
    ITEM_CONTAINER_CLS = "menu_item_container",
    TAB_CONTAINER_CLS = "tab_container",
    TAB_TEXT_CLS = "tab_text"
}

/**
 * Implementation of a menu that can instantiate Units.
 */
export default class Dock<Unit extends LocationNode & IScalable & IDepictable = (LocationNode & IScalable & IDepictable)>
    extends LocationContext<Unit> implements IDepictable {

    private registeredItems: Map<string, DockItem<Unit> | undefined> = new Map<string, DockItem<Unit> | undefined>();
    private subscriptions: Map<string, Subscription> = new Map();
    private itemsCreated: number = 0;
    public readonly config: DockConfig;
    private $nodePlacement: Subject<Unit> = new Subject();

    public anchor: AnySelection | undefined;

    constructor(name?: string, config: DockConfig = defaultConfigurations.dock) {
        super();
        if (name) config.rename(name);
        this.config = config;

        // hook position listeners to snap, if the Unit is draggable
        this.$add.subscribe((nodes: Unit[]) => {

            nodes.forEach(n => {

                // if this node happens to be Draggable
                if (isDraggable(n)) {

                    this.subscriptions.set(
                        n.id,
                        n.onDragEnd(() => {
                            this.snap(n)
                        })
                    );

                }

            });

        });

        // upon removal, clear subscription and remove from tracker
        this.$rm.subscribe((nodes: Unit[]) => {

            nodes.forEach(n => {

                this.subscriptions.get(n.id)?.unsubscribe();
                this.subscriptions.delete(n.id);

            });

        });

    }


    snap(node: Unit): ICoordinate {

        // debugger

        const assignedItem = this.registeredItems.get(node.name);
        const assignedBox = assignedItem?.container;
        const menuBounds = this.config.bounds;

        // if node is either above the menu, or the predicate function returns false, snap it back into the box
        if ((assignedItem && assignedBox) && (menuBounds.overlaps(node.unscaledPosition()) || !assignedItem.placementPredicate(node)))
            return node.translateToCoord(assignedBox);
        else if (!assignedItem) throw new Error("No menu item assigned to this node.");
        else if (!assignedBox) throw new Error("No assigned box found.");
        else {
            // NODE PLACEMENT

            // remove from this graph
            this.rm(node.id);

            // remove menu scale
            node.resetScale();

            // de-sociate depiction from this container
            node.deleteDepiction();

            // generate new instance
            const associatedMenuItem = this.registeredItems.get(node.name);
            if (associatedMenuItem) this.instantiate(associatedMenuItem);

            // rename old instance
            node.rename("New " + assignedItem.title);

            // external handler
            this.$nodePlacement.next(node);

            // return
            return node;

        };
        // else connect to node context and apply the transform

    }

    /** DO NOT USE ADD ON THE DOCK. Instead, register depictable items. Items can be draggable. See `register()` documentation. */
    add(...n: Unit[]): this {
        console.error("You cannot add items to the menu context manually.");
        return this;
    }

    /**
     * Returns the next available bounding coordinates based on the number of items in the dock.
     * @param bounds
     * @param index
     */
    getNextBox(index: number = 0): Rectangle {

        const {
            bounds,
            dockItemContainerConfig: {
                width
            },
            margin
        } = this.config;

        // square
        const menuItemContainerSize = width;

        const rowSize = Math.round(bounds.length.x / menuItemContainerSize)

        // first translate by the margin
        const newTopLeft = bounds.topLeft.copy.translateBy(margin, margin);
        let currentRow = (index - (index % rowSize)) / rowSize;

        // translate by the size of the container times index
        newTopLeft.translateBy(
            ((index % (rowSize - 1)) * menuItemContainerSize + (index % (rowSize - 1)) * margin) + margin,
            (currentRow * menuItemContainerSize) + margin
        );

        return Rectangle.fromCorners(newTopLeft, newTopLeft.copy.translateBy(menuItemContainerSize, menuItemContainerSize));

    }

    get allMenuItems(): DockItem<Unit>[] {
        // filter removed items and cast properly because js sucks
        return [... this.registeredItems.values()].filter(_ => _ !== undefined) as DockItem<Unit>[];
    }

    /**
     * Registers a menu item. If instantiated items (can be fetched by running Dock.nodes) translate to a location
     * within the bounds of the doc, and snapped, they will be snapped back to the box. If outside the bounds of the dock,
     * snapping will trigger the `placementPredicate` function, which should return true if the item is at a position
     * that is valid. If it is valid, the Dock will run its removal/placement routine, resetting the node's scale, removing it
     * from this context, deleting its depiction, and triggering the $nodePlacement observable. The Dock is not responsible
     * for placing the node, this should be handled by whoever manages the Dock.
     *
     * @param title {string} the title that will be displayed for a given item.
     * @param description {string} the description to be displayed for the given item
     * @param constructor {function} function that instantiates the Unit
     * @param placementPredicate {function} returns true if the unit is currently at a valid placement location.
     *
     * @returns {string} the ID of this new menu item. Can be used to fetch information about the item externally.
     */
    public register<NewUnit extends Unit>(
        title: string,
        description: string,
        constructor: UnitConstructor<NewUnit>,
        placementPredicate: (unit: NewUnit) => boolean = () => false
    ): string {
        const id = "menu_item_" + this.registeredItems.size;
        const container = this.getNextBox(this.registeredItems.size);
        const item = new DockItem<NewUnit>(id, title, description, constructor, placementPredicate, container);

        this.registeredItems.set(
            id,
            item
        );

        this.instantiate(item);

        return id;
    }

    private instantiate<NewUnit extends Unit>(item: DockItem<NewUnit>): Unit {

        const {container, title, id} = item;
        const gameUnitInstance = item.make(container.x, container.y, title + this.itemsCreated, id);

        // passing ID as name, means that this node is associated with this menu item
        super.add(gameUnitInstance);

        if (this.anchor) gameUnitInstance.attachDepictionTo(this.anchor);
        gameUnitInstance.scaleToFit(container);

        this.itemsCreated++;

        return gameUnitInstance;

    }

    attachDepictionTo(d3selection: AnySelection): void {

        const {
            config
        } = this;

        const selection = d3selection.append(SVGTags.SVGGElement)
            .classed(DockCSS.MAIN_CONTAINER_CLS, true);

        // draw main container
        rect(selection, config);

        this.attachTabDepictionTo(selection);

        // draw containers for each registered item
        selection.selectAll<SVGGElement, DockItem<Unit>>("." + DockCSS.ITEM_CONTAINER_CLS)
            .data(this.allMenuItems)
            .enter()
            .append(SVGTags.SVGGElement)
            .classed(DockCSS.ITEM_CONTAINER_CLS, true)
            .append(SVGTags.SVGRectElement)
            .attr(SVGAttrs.x, _ => _.container.topLeft.x)
            .attr(SVGAttrs.y, _ => _.container.topLeft.y)
            .attr("center", c =>`( ${c.container.x}, ${c.container.y} )`)
            .attr(SVGAttrs.width, _ => _.container.width)
            .attr(SVGAttrs.height, _ => _.container.height)
            .attr(SVGAttrs.fill, config.dockItemContainerConfig.fill)
            .attr(SVGAttrs.rx, config.dockItemContainerConfig.rx);

        // attach depictions if they haven't been attached yet
        for (let unit of this.nodes.values()) {
            unit.attachDepictionTo(selection);
            unit.scaleToFit(this.getNextBox(0));
        }

        this.anchor = selection;
    }

    attachTabDepictionTo(selection: AnySelection): void {

        const {config} = this;

                // tab geometry
        const textMargin = 1.2;
        const height = 4.5;
        const defaultWidth = 4.5 * height;
        const start = config.bounds.topLeft.copy // .translateBy(0.005 * dockWidth, 0);
        const topL = start.copy.translateBy(0, -height);
        const textStart = start.midpoint(topL).translateBy(textMargin, 0);
        const fontSize = 2.25;

        // draw tab title
        const tabG = selection.append(SVGTags.SVGGElement)
        .classed(DockCSS.TAB_CONTAINER_CLS, true);

        const pathSelec = tabG.append(SVGTags.SVGPathElement)
            .attr(SVGAttrs.fill, config.stroke)
            .attr(SVGAttrs.stroke, config.secondaryColor)
            .attr(SVGAttrs.strokeWidth, config.strokeWidth);

        const text = tabG.append(SVGTags.SVGTextElement)
            .classed(DockCSS.TAB_TEXT_CLS, true)
            .text(this.config.title)
            .attr(SVGAttrs.x, textStart.x)
            .attr(SVGAttrs.y, textStart.y)
            .attr(SVGAttrs.alignment, SVGAttrs.alignment_middle)
            .style(SVGAttrs.fontSize, fontSize);

        // @ts-ignore
        const textWidth = text.node()?.getBBox()?.width;
        const topR = topL.copy.translateBy((textWidth ? textWidth : defaultWidth) + 2 * textMargin, 0);
        const end = topR.copy.translateBy(defaultWidth / 6, height);

        pathSelec.attr(SVGAttrs.d, (): string => {
            const p = path();

            p.moveTo(start.x, start.y);
            p.lineTo(topL.x, topL.y);
            p.lineTo(topR.x, topR.y);
            p.lineTo(end.x, end.y);

            return p.toString()
        })
            

    }

    deleteDepiction(): void {
        this.anchor?.remove();
    }

    delete() {
        this.deleteDepiction();
        this.$nodePlacement.complete();
    }

    // TODO: finish implementation, update text content
    refresh(): void {

        const dataJoin = this.anchor?.selectAll<SVGGElement, DockItem<Unit>>("." + DockCSS.ITEM_CONTAINER_CLS)
            .data(this.allMenuItems);

        dataJoin?.attr(SVGAttrs.x, _ => _.container.topLeft.x)
            .attr(SVGAttrs.y, _ => _.container.topLeft.y)
            .attr(SVGAttrs.width, _ => _.container.width)
            .attr(SVGAttrs.height, _ => _.container.height)
            .attr(SVGAttrs.fill, this.config.dockItemContainerConfig.fill);

        dataJoin?.exit().remove();

    }

    onNodePlacement(handler: (node: Unit) => void): Subscription {
        return this.$nodePlacement.subscribe(handler);
    }

}

/**
 * Encapsulates a LocationUnit to be displayed in the menu. This is "stuck" to its box in the
 * MenuContext, and can be placed in whatever context controls this MenuContext.
 * Upon placement, new menu items are re-generated as many times as they are allowed to be, as defined by
 * the 'allowedCopies' parameter.
 */
class DockItem<NewUnit> {
    id: string;
    title: string;
    description: string;
    make: UnitConstructor<NewUnit>;
    placementPredicate: (unit: any) => boolean
    container: Rectangle;

    constructor(
        id: string,
        title: string,
        description: string,
        makeFunction: UnitConstructor<NewUnit>,
        placementPredicate: (unit: NewUnit) => boolean,
        container: Rectangle
    ) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.make = makeFunction;
        this.placementPredicate = placementPredicate;
        this.container = container;
    }
}

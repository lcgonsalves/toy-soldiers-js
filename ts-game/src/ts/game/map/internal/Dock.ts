import { ICoordinate } from "ts-shared/build/lib/geometry/Coordinate";
import { LocationContext } from "ts-shared/build/lib/mechanics/Location";
import LocationUnit from "../../units/LocationUnit";
import { AnySelection, rect, RectConfig } from "../../../util/DrawHelpers";
import Rectangle from "ts-shared/build/lib/geometry/Rectangle";
import { IDepictable } from "../../units/UnitInterfaces";
import SVGTags from "../../../util/SVGTags";
import SVGAttrs from "../../../util/SVGAttrs";

type AcceptedUnits = LocationUnit;
type UnitConstructor<Unit> = (x: number, y: number, id: string, name: string) => Unit

enum DockContextCSS {
    MAIN_CONTAINER_CLS = "menu_main_container",
    ITEM_CONTAINER_CLS = "menu_item_container"
}

export class DockConfig extends RectConfig {
    readonly menuItemContainerSize: number;
    readonly margin: number;

  constructor(
      topLeft: ICoordinate,
      width: number,
      height: number,
      menuItemContainerSize: number, 
      margin: number,
      cls?: string
    ) {
    super(topLeft, width, height, cls);
    this.menuItemContainerSize = menuItemContainerSize
    this.margin = margin
  }

}

export default class DockContext extends LocationContext<AcceptedUnits> implements IDepictable {

    private registeredItems: Map<string, DockItem<AcceptedUnits> | undefined> = new Map<string, DockItem<AcceptedUnits> | undefined>();
    private itemsCreated: number = 0;
    public readonly config: {
        mainContainer: RectConfig,
        menuItemContainerSize: number,
        margin: number
    };

    /**
     * A function that is called once a node is placed outside of the bounds of the menu.
     */
    public onNodePlacement: (node: LocationUnit) => void = () => { };
    private anchor: AnySelection | undefined;

    constructor(mainContainerConfig: RectConfig) {
        super();

        const defaultMargin = 0.5;
        this.config = {
            mainContainer: mainContainerConfig,
            menuItemContainerSize: (mainContainerConfig.bounds.width / 15) - (defaultMargin / 15),
            margin: defaultMargin
        };

    }

    snap(node: AcceptedUnits): ICoordinate {

        const assignedItem = this.registeredItems.get(node.name);
        const assignedBox = assignedItem?.container;
        const menuBounds = this.config.mainContainer.bounds;

        if (assignedBox && menuBounds.overlaps(node.unscaledPosition))
            return node.translateToScaledCoord(assignedBox);
        else if (!assignedItem) throw new Error("No menu item assigned to this node.");
        else if (!assignedBox) throw new Error("No assigned box found.");
        else {
            // remove from this graph
            this.rm(node.id);

            // remove menu scale
            node.rmScale();

            // generate new instance
            const associatedMenuItem = this.registeredItems.get(node.name);
            if (associatedMenuItem) {
                const newInstance = this.instantiate(associatedMenuItem);
                const {anchor} = this;

                // if we have an anchor available, render object
                if (anchor) {
                    newInstance.attachDepictionTo(anchor);
                    newInstance.scaleToFit(associatedMenuItem.container);
                }
            }

            // rename old instance
            node.rename("New " + assignedItem.title);

            // de-sociate depiction from this container
            node.deleteDepiction();

            // external handler
            this.onNodePlacement(node);

            // return
            return node;
        };
        // else connect to node context and apply the transform

    }

    add(...n: LocationUnit[]): this {
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
            mainContainer: {
                bounds
            },
            menuItemContainerSize,
            margin
        } = this.config;


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

    get allMenuItems(): DockItem<AcceptedUnits>[] {
        // filter removed items and cast properly because js sucks
        return [... this.registeredItems.values()].filter(_ => _ !== undefined) as DockItem<AcceptedUnits>[];
    }

    /**
     * Registers a menu item.
     * @returns {string} the ID of this new menu item. Can be used to control said menu
     * item externally.
     */
    public register<NewUnit extends AcceptedUnits>(
        title: string,
        description: string,
        constructor: UnitConstructor<NewUnit>
    ): void {
        const id = "menu_item_" + this.registeredItems.size;
        const container = this.getNextBox(this.registeredItems.size);
        const item = new DockItem<NewUnit>(
            id,
            title,
            description,
            constructor,
            container
        );

        this.registeredItems.set(
            id,
            item
        );

        this.instantiate(item);
    }

    private instantiate(item: DockItem<LocationUnit>): LocationUnit {

        const {container, title, id} = item;
        const gameUnitInstance = item.make(container.x, container.y, title + this.itemsCreated, id);
        // passing ID as name, means that this node is associated with this menu item
        super.add(gameUnitInstance);
        if (this.anchor) gameUnitInstance.attachDepictionTo(this.anchor);

        this.itemsCreated++;

        return gameUnitInstance;

    }

    attachDepictionTo(d3selection: AnySelection): void {

        const selection = d3selection.append(SVGTags.SVGGElement)
            .classed(DockContextCSS.MAIN_CONTAINER_CLS, true);

        // TODO: write depiction of the box menu
        // TODO: render thing in place

        // draw main container
        rect(selection, this.config.mainContainer);

        // draw containers for each registered item
        selection.selectAll<SVGGElement, DockItem<AcceptedUnits>>("." + DockContextCSS.ITEM_CONTAINER_CLS)
            .data(this.allMenuItems)
            .enter()
            .append(SVGTags.SVGGElement)
            .classed(DockContextCSS.ITEM_CONTAINER_CLS, true)
            .append(SVGTags.SVGRectElement)
            .attr(SVGAttrs.x, _ => _.container.topLeft.x)
            .attr(SVGAttrs.y, _ => _.container.topLeft.y)
            .attr(SVGAttrs.width, _ => _.container.width)
            .attr(SVGAttrs.height, _ => _.container.height)
            .attr(SVGAttrs.fill, "#e8e8e8");

        // attach depictions if they haven't been attached yet
        for (let unit of this.nodes.values()) {
            unit.attachDepictionTo(selection);
            unit.scaleToFit(this.getNextBox(0));
        }

        this.anchor = selection;
    }

    deleteDepiction(): void {
    }

    refresh(): void {

        const dataJoin = this.anchor?.selectAll<SVGGElement, DockItem<AcceptedUnits>>("." + DockContextCSS.ITEM_CONTAINER_CLS)
            .data(this.allMenuItems);

        dataJoin?.append(SVGTags.SVGGElement)
            .classed(DockContextCSS.ITEM_CONTAINER_CLS, true)
            .append(SVGTags.SVGRectElement)
            .attr(SVGAttrs.x, _ => _.container.topLeft.x)
            .attr(SVGAttrs.y, _ => _.container.topLeft.y)
            .attr(SVGAttrs.width, _ => _.container.width)
            .attr(SVGAttrs.height, _ => _.container.height)
            .attr(SVGAttrs.fill, "#e8e8e8");

        dataJoin?.exit().remove();

    }

}

/**
 * Encapsulates a LocationUnit to be displayed in the menu. This is "stuck" to its box in the
 * MenuContext, and can be placed in whatever context controls this MenuContext.
 * Upon placement, new menu items are re-generated as many times as they are allowed to be, as defined by
 * the 'allowedCopies' parameter.
 */
class DockItem<NewUnit extends AcceptedUnits> {
    id: string;
    title: string;
    description: string;
    make: UnitConstructor<NewUnit>;
    container: Rectangle;

    constructor(
        id: string,
        title: string,
        description: string,
        makeFunction: UnitConstructor<NewUnit>,
        container: Rectangle
    ) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.make = makeFunction;
        this.container = container;
    }
}

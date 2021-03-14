import {AnySelection} from "../../util/DrawHelpers";
import {Selection} from "d3-selection";
import {ICoordinate, IMovable} from "ts-shared/build/geometry/Coordinate";
import {IDraggable} from "./Draggable";
import {GenericConstructor} from "ts-shared/build/util/MixinUtil";
import LocationNode from "ts-shared/build/graph/LocationNode";
import {ICopiable} from "ts-shared/build/util/ISerializable";
import SVGAttrs from "../../util/SVGAttrs";
import SVGTags from "../../util/SVGTags";

/**
 * Encompasses operations for mounting and unmounting from UI.
 */
export interface IDepictable<E extends SVGElement = SVGGElement> {

    /** Depictable elements may be unanchored at any point */
    readonly anchor: Selection<E, any, any, any>  | undefined;

    /** Attaches game unit to a d3 selection, appending elements and assigning event handlers. */
    attachDepictionTo(d3selection: AnySelection): void;

    /** Removes SVG element containing this depictable element. */
    deleteDepiction(): void;

    /** Refreshes depiction to reflect any changes in this Unit's content */
    refresh(): void;

}

export interface IDepictableWithSprite<E extends SVGElement = SVGGElement>
    extends IDepictable<E> {

    /** Shape, or composite shape, or other IDepictable (if my code works) can be used to represent this object. */
    readonly sprite: (IDepictable & IMovable & ICopiable) | undefined;

}


/**
 * Attaches functionality to allow class Base to have a depiction
 * @param Base the base class
 *
 * @param sprite
 * @constructor
 */
export function DepictableUnit<
    T extends GenericConstructor<LocationNode>,
    S extends IDepictable & IMovable & ICopiable
    >(Base: T, sprite: S /* TODO: = SampleShapes.example */ ) {

    return class Depictable extends Base implements IDepictableWithSprite, IMovable {

        anchor: Selection<SVGGElement, IDepictable, any, any> | undefined;
        sprite: (IDepictable & IMovable & ICopiable) | undefined;

        attachDepictionTo(d3selection: AnySelection): void {

            // preprocess selection – add a svg group to contain everything
            const container = d3selection.append<SVGGElement>(SVGTags.SVGGElement)
                .classed(this.name, true);
            this.anchor = container;

            // if we haven't grabbed a copy of the sprite yet, we do it now.
            if (!this.sprite) this.sprite = sprite.duplicate();

            // we translate the sprite to the unit
            this.sprite.translateToCoord(this);

            // then we attach it to the selection
            this.sprite.attachDepictionTo(container);

        }

        deleteDepiction(): void {
            this.sprite?.deleteDepiction();
            this.anchor?.selectAll("*").remove();
            this.anchor?.remove();
        }

        refresh(): void {
            this.sprite?.refresh();
        }

        // TODO: watch changes in position reactively
        translateBy(x: number, y: number): ICoordinate {
            const dest = super.translateBy(x, y);
            // translate sprite
            this.sprite?.translateBy(x, y);

            this.refresh();
            return dest;
        }

        translateTo(x: number, y: number): ICoordinate {
            const dest = super.translateTo(x, y);
            // translate sprite
            this.sprite?.translateTo(x, y);

            this.refresh();
            return dest;
        }

        translateToCoord(other: ICoordinate): ICoordinate {
            const dest = super.translateToCoord(other);
            // translate sprite
            this.sprite?.translateToCoord(other);

            this.refresh();
            return dest;
        }

    }
}

export interface IGameUnit extends IDepictable {
    /** the class of the outer container */
    readonly cls: string;

}

export interface INodeUnit extends IGameUnit {
    /** Attaches depictions of game unit edges to selection */
    attachEdgeDepictionTo(d3selection: AnySelection): void;

    /** */
    deleteEdgeDepiction(): void;
}

export type DragHandler = (evt: any, n: IDraggable, coords: ICoordinate) => void
export type Handler = (this: SVGGElement, event: any) => void


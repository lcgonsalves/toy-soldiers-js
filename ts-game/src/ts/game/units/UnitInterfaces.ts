import {AnySelection} from "../../util/DrawHelpers";
import {Selection} from "d3-selection";
import {ICoordinate} from "ts-shared/build/geometry/Coordinate";
import {IDraggable} from "./Draggable";
import {GenericConstructor} from "ts-shared/build/util/MixinUtil";
import AbstractNode from "ts-shared/build/graph/AbstractNode";

/**
 * Encompasses operations for mounting and unmounting from UI.
 */
export interface IDepictable {

    /** Depictable elements may be unanchored at any point */
    readonly anchor: Selection<SVGGElement, this, any, any>  | undefined;

    /** Attaches game unit to a d3 selection, appending elements and assigning event handlers. */
    attachDepictionTo(d3selection: AnySelection): void;

    /** Removes SVG element containing this depictable element. */
    deleteDepiction(): void;

    /** Refreshes depiction to reflect any changes in this Unit's content */
    refresh(): void;

    /** Translates element to the snapping coordinate, as defined in the implementation. */
    snapSelf(): void;

}

/**
 * Attaches functionality to allow class Base to have a depiction
 * @param Base the base class
 *
 * @constructor
 */
export function DepictableUnit<T extends GenericConstructor<AbstractNode>>(
    Base: T
) {
    // @ts-ignore
    return class Depictable extends Base implements IDepictable {

        readonly anchor: Selection<SVGGElement, this, any, any> | undefined;

        attachDepictionTo(d3selection: AnySelection): void {
        }

        deleteDepiction(): void {
        }

        refresh(): void {
        }

        snapSelf(): void {
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


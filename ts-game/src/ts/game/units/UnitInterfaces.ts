import {AnySelection} from "../../util/DrawHelpers";
import {ICoordinate} from "ts-shared/build/lib/geometry/Coordinate";

export interface IGameUnit {
    /** the class of the outer container */
    readonly cls: string;
    /** sets the game unit to display debug information */
    debugMode: boolean;

    /** attaches game unit to a d3 selection */
    attachDepictionTo(d3selection: AnySelection): void;
    /** refreshes depiction to reflect any changes in this Unit's content */
    refresh(): void;

}

export interface INodeUnit extends IGameUnit {
    /** Attaches depictions of game unit edges to selection */
    attachEdgeDepictionTo(d3selection: AnySelection): void;
}

export type DragHandler = (evt: any, n: IDraggable, coords: ICoordinate) => void
export type Handler = (this: SVGGElement, event: any) => void

export interface IDraggable extends ICoordinate {

    /** Initializes drag behavior. */
    initializeDrag(): void;

    /**
     * Registers a new action to be performed when IDraggable begins to be dragged.
     * Actions will be performed in the order in which they are registered.
     * @param {string} actionName The name of the action.
     * @param {DragHandler} newAction
     */
    onDragStart(actionName: string, newAction: DragHandler): string;
    /** Remove handler associated with the action name, returns false if none exists. */
    removeOnDragStart(actionName: string): boolean;

    /**
     * Registers a new action to be performed while element is being dragged.
     * Actions will be performed in the order in which they are registered.
     * @param {string} actionName The name of the action.
     * @param {DragHandler} newAction
     */
    onDrag(actionName: string, newAction: DragHandler): string;
    /** Remove handler associated with the action name, returns false if none exists. */
    removeOnDrag(actionName: string): boolean;

    /**
     * Registers a new action to be performed when IDraggable stops being dragged.
     * Actions will be performed in the order in which they are registered.
     * @param {string} actionName The name of the action.
     * @param {DragHandler} newAction
     */
    onDragEnd(actionName: string, newAction: DragHandler): string;
    /** Remove handler associated with the action name, returns false if none exists. */
    removeOnDragEnd(actionName: string): boolean;

}

// supported events
export enum DragEvents {
    START = "start",
    DRAG = "drag",
    END = "end"
}

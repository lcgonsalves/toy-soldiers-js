import SimpleDirectedGraph from "../graph/SimpleDirectedGraph";
import {IGraphNode} from "../graph/GraphInterfaces";
import {ICoordinate} from "../geometry/Coordinate";

/**
 *  Map container. Coordinates node interaction.
 */
export default abstract class WorldContext<Unit extends IGraphNode> extends SimpleDirectedGraph<Unit>{

    /**
     * Snaps given coordinate to a valid coordinate, according to the rules of the particular world context.
     * @param coordinate
     */
    public abstract snap(coordinate: ICoordinate): ICoordinate;

}

enum Relationship {
    MUTUAL,
    EXCLUSIVE
}


/**
 * Defines the interactions between two World Contexts. If this is to be inferred as a directed interaction, the first
 * parameter indicates the type of subject who acts, and the second parameter indicates the object who is acted upon.
 */
export type ContextInteraction<S extends IGraphNode, O extends IGraphNode> = (subj: WorldContext<S>, obj: WorldContext<O>) => InteractionResult;

/**
 * Defines interactions between Units. If this is to be inferred as a directed interaction, the first
 * parameter indicates the type of subject who acts, and the second parameter indicates the object who is acted upon.
 */
export type Interaction<S extends IGraphNode, O extends IGraphNode> = (subj: S, obj: O) => InteractionResult;

interface InteractionResult {
    readonly success: boolean;
}

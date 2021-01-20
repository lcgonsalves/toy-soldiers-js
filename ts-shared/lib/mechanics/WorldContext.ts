import SimpleDirectedGraph from "../graph/SimpleDirectedGraph";
import {IGraphNode} from "../graph/GraphInterfaces";

/**
 *  Map container. Coordinates node interaction.
 */
export default abstract class WorldContext<Unit extends IGraphNode> extends SimpleDirectedGraph<Unit>{
    // contains all interactions where the unit in this context is the actor
    public readonly registeredInteractions: Array<Interaction<Unit, IGraphNode>>  = [];
    // contains all interactions where this context is the actor
    public readonly registeredContextInteractions: Array<ContextInteraction<Unit, IGraphNode>> = [];
    // contexts that are bound to one another
    public readonly associatedContexts: Array<WorldContext<IGraphNode>> = [];

    public registerInteraction(interaction: Interaction<any, any>): void {
        this.registeredInteractions.push(interaction);
    }

    public associate(otherContext: WorldContext<Unit>, relationship: Relationship): void {
        this.associatedContexts.push(otherContext);
        // todo: impl relationship
    }

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

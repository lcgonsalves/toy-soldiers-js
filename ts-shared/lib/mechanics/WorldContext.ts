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

    onAdd: (n: Unit) => void = (n: Unit): void => {}

}


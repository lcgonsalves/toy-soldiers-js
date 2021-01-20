import WorldContext from "./WorldContext";
import LocationNode from "../graph/LocationNode";

export class LocationContext<N extends LocationNode> extends WorldContext<N> {

    // all nodes in the location context must be associated with said context
    add(...n: N[]): LocationContext<N> {
        super.add(...n);
        n.forEach(_ => _.associate(this));
        return this;
    }

}

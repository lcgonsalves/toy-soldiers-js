import * as WebsocketEventDefinitions from "./socket/EventTypes";
import * as WebsocketTools from "./socket/WebsocketManager";
import DirectedGraph from "./graph/DirectedGraph";
import Node from "./graph/Node";

// todo remove
const a = new Node("A", 0, 0);
const b = new Node("B", 0, 0);
const c = new Node("C", 0, 0);

const g = new DirectedGraph().addAndConnect(a,b).addAndConnect(a,c);
g.removeAndDisconnect(b);

console.log(a.edges);

export {WebsocketEventDefinitions};
export {WebsocketTools};

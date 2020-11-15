import * as WebsocketEventDefinitions from "./socket/EventTypes";
import * as WebsocketTools from "./socket/WebsocketManager";
import DirectedGraph from "./graph/DirectedGraph";
import Node from "./graph/Node";

var window = global.window;

// todo remove
const a = new Node("A", 0, 0);
const b = new Node("B", 0, 0);
const c = new Node("C", 0, 0);

const g = new DirectedGraph().addAndConnect(a,b).addAndConnect(a,c);

console.log(g.get(new Node("A", 43243, 434)));

export {WebsocketEventDefinitions};
export {WebsocketTools};

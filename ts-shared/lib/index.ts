import * as WebsocketEventDefinitions from "./socket/EventTypes";
import * as WebsocketTools from "./socket/WebsocketManager";
import {Interval} from "./geometry/Interval";

let i = new Interval(0.986, 10, 1);

console.log(i.map(n => "Num " + n));
console.log(i.contains(4.43242342));

export {WebsocketEventDefinitions};
export {WebsocketTools};

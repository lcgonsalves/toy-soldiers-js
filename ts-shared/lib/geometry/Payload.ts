import {Coordinate, ICoordinate} from "./Coordinate";
import {Subject} from "rxjs";
import Rectangle from "./Rectangle";

/**
 * Coordinate, but you can associate an object to it.
 */
export class PayloadCoordinate<Payload> extends Coordinate implements IPayload<Payload> {

    public payload: Payload;

    constructor(payload: Payload, initialPosition?: {x: number, y: number}) {
        super(initialPosition ? initialPosition.x : 0, initialPosition ? initialPosition.y : 0);
        this.payload = payload;
    }

    public setPayload(newPayload: Payload) {
        this.payload = newPayload;
    }

}

export class PayloadRectangle<Payload> extends Rectangle implements IPayload<Payload> {

    public payload: Payload;

    constructor(
        payload: Payload,
        center: ICoordinate = Coordinate.origin,
        width: number = 10,
        height: number = 10
    ) {
        super(
            center.copy.translateBy(-width / 2, -height/ 2),
            center.copy.translateBy(width / 2, -height/ 2),
            center.copy.translateBy(-width / 2, height/ 2),
            center.copy.translateBy(width / 2, height/ 2)
        );

        this.payload = payload;
    }

    public setPayload(newPayload: Payload) {
        this.payload = newPayload;
    }

}

export interface IPayload<Payload> {

    payload: Payload;
    setPayload(newPayload: Payload);

}

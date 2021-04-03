import {IGraphNode} from "ts-shared/build/graph/GraphInterfaces";
import {Selection} from "d3-selection";
import {AnySelection, defaultDepictions} from "../../util/DrawHelpers";
import {IDepictable, Sprite} from "./mixins/Depictable";
import {LineShape} from "../shape/LineShape";
import SVGTags from "../../util/SVGTags";
import {combineLatest, Observable, Observer, race, Subject, Subscription} from "rxjs";
import {ICoordinate} from "ts-shared/build/geometry/Coordinate";
import {throttleTime} from "rxjs/operators";
import {CompositeShape} from "../shape/CompositeShape";

export enum RoadUnitCSS {
    ROAD_CLS = "road"
}

export const RoadUnitDepiction = (
    source: ICoordinate,
    destination: ICoordinate,
    name?: string,
    clickable: boolean = false
) => new CompositeShape(name ?? "untitled").addLine([source, destination], defaultDepictions.noFill.grays.medium.setClickable(clickable));

/** Represents a road – a connection between two IGraphNodes */
export class RoadUnit implements IDepictable {
    source: ICoordinate;
    destination: ICoordinate;
    sprite: Sprite;
    anchor: Selection<SVGGElement, any, any, any> | undefined;

    private positionChangeObservers: Subscription[] = [];

    constructor(
        source: ICoordinate,
        destination: ICoordinate,
        sourceSocket: ICoordinate = source,
        destinationSocket: ICoordinate = destination,
        clickable: boolean = false
    ) {
        this.source = source;
        this.destination = destination;
        this.sprite = RoadUnitDepiction(sourceSocket, destinationSocket, source.toString() + destination.toString(), clickable);

        this.positionChangeObservers.push(
            destinationSocket.$positionChange.subscribe(() => this.refresh()),
            sourceSocket.$positionChange.subscribe(() => this.refresh())
        );

    }

    attachDepictionTo(d3selection: AnySelection): void {
        this.anchor = d3selection.append(SVGTags.SVGGElement).classed(RoadUnitCSS.ROAD_CLS, true);
        this.sprite.attachDepictionTo(this.anchor);
    }

    delete(): void {
        this.positionChangeObservers.forEach(_=>_.unsubscribe());
        this.deleteDepiction();
    }

    deleteDepiction(): void {
        this.sprite.delete();
    }

    refresh(): void {
        this.sprite.refresh();
    }

}
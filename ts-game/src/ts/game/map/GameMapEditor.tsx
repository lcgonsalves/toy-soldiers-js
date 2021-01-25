import React, {Component} from 'react';


import "../../../css/DirectedGraph.css";
import "../../../css/Editor.css"

import {LocationContext} from "ts-shared/build/lib/mechanics/Location";
import {Coordinate, ICoordinate} from "ts-shared/build/lib/geometry/Coordinate";
import {MapEditorMap} from "./internal/MapEditorMap";
import LocationUnit from "../units/LocationUnit";


// todo: move state to props
interface GameMainProps {

}

interface GameMainState {
    displayTooltip: boolean;
    tooltipLocation: ICoordinate;
    cursorLocation: ICoordinate | undefined;
}

// type shorthand for ease of reading
type ReactSVGRef = React.RefObject<SVGSVGElement>;

class GameMapEditor extends Component<GameMainProps, GameMainState> {
    state: GameMainState;
    nodeContext: LocationContext<LocationUnit> = new LocationContext<LocationUnit>(10);
    private svgElement: ReactSVGRef = React.createRef();
    public static readonly cssClass: string = "map-editor";

    constructor(props: any) {
        super(props);

        // conversion from LocationNode to LocationUnit will occur in the websocket util
        const a = new LocationUnit("Location A", "a", new Coordinate(10, 10),2);
        const b = new LocationUnit("Location B", "b", new Coordinate(40, 40),2);
        const c = new LocationUnit("Location C", "c", new Coordinate(20, 20),2);
        const d = new LocationUnit("Location D", "d", new Coordinate(44, 37),2);

        a.connectTo(b);

        const locations = [
            a,
            b,
            c,
            d
        ];

        this.nodeContext.add(...locations);

        this.state = {
            displayTooltip: false,
            tooltipLocation: new Coordinate(0, 0),
            cursorLocation: undefined
        };

    }

    componentDidMount(): void {
        const d3ReactAnchor = this.svgElement.current


        if (d3ReactAnchor) {

            const conf = {
                backgroundColor: "#dbdbdb",
                foregroundColor: "#c4c4c4",
                gridStroke: "#545454",
                zoomBuffer: 25,
            };

            new MapEditorMap(this.nodeContext, d3ReactAnchor, conf);


        }

    }

    componentDidUpdate(prevProps: Readonly<GameMainProps>, prevState: Readonly<GameMainState>, snapshot?: any): void {
        // this.lnus.forEach(_ => _.refresh());
    }

    public render() {

        return (
            <div
                className={GameMapEditor.cssClass}
            >
                <svg
                    ref={this.svgElement}
                    height="100vh"
                    width="100vw"
                    viewBox={`0 0 100 100`}
                />
            </div>
        );
    }

}


export default GameMapEditor;

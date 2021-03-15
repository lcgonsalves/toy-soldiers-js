import React, {Component} from 'react';

import "../../../css/DirectedGraph.css";
import "../../../css/Editor.css"

import {MapEditorController} from "./internal/MapEditorController";
import {Coordinate, ICoordinate} from "ts-shared/build/geometry/Coordinate";
import {LocationContext} from "ts-shared/build/mechanics/Location";
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
    private svgElement: ReactSVGRef = React.createRef();
    public static readonly cssClass: string = "map-editor";

    constructor(props: any) {
        super(props);

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

            new MapEditorController(d3ReactAnchor, conf);


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

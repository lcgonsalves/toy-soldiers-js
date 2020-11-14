import React, {Component} from 'react';
import {Coordinate, ICoordinate} from "ts-shared/build/geometry/Coordinate";

interface TooltipProps {
    position: ICoordinate,
    cooldown: number,
    display: boolean
}
interface TooltipState {
    readyToChangePosition: boolean,
    currentPosition: ICoordinate
}

/** represents a tooltip containing information or buttons */
class Tooltip extends Component<TooltipProps, TooltipState>{
    timeout: number = -1;

    constructor(props: TooltipProps) {
        super(props);

        this.state = {
            readyToChangePosition: false,
            currentPosition: new Coordinate(-100, -100)
        }
    }

    // shorthand
    private timeoutExists(): boolean {
        return this.timeout > 0;
    }

    componentDidMount(): void {
        this.setState({ readyToChangePosition: true });
    }

    shouldComponentUpdate(nextProps: Readonly<TooltipProps>, nextState: Readonly<TooltipState>, nextContext: any): boolean {
        if (this.state.readyToChangePosition) {
            this.setState({ readyToChangePosition: false, currentPosition: this.props.position });
            setTimeout(() => this.setState({ readyToChangePosition: true }), this.props.cooldown);
            return true;
        } else return false;
    }

    componentWillUnmount(): void {
        // avoid setting state after unmount
        if (this.timeoutExists()) {
            clearTimeout(this.timeout);
        }
    }

    render() {
        const {x,y} = this.state.currentPosition;

        const CSSPosition = {
            left: `${x}px`,
            top: `${y}px`
        };

        return <div className="tooltip" style={CSSPosition}>
            <button onClick={() => console.log("click")}>+</button>
        </div>
    }
}

export default Tooltip;
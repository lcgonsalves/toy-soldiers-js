import IComparable from "../util/IComparable";
export default interface ITwoDimensional extends IComparable {
    x: number;
    y: number;
    /**
     * Returns the midpoint between two point-like items.
     * @param other
     */
    midpoint(other: ITwoDimensional): ITwoDimensional;
    /**
     * Returns the distance between two point-like items.
     * @param other
     */
    distance(other: ITwoDimensional): number;
}

export default interface IComparable {
    /**
     * Returns true if objects are functionally equal.
     * @param other
     */
    equals(other: IComparable): boolean;
}
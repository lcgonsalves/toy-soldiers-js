import WorldContext from "./WorldContext";
import LocationNode from "../graph/LocationNode";
import {Coordinate, ICoordinate} from "../geometry/Coordinate";

export class LocationContext<N extends LocationNode> extends WorldContext<N> {

    // all nodes in the location context must be associated with said context
    add(...n: N[]): LocationContext<N> {
        super.add(...n);
        n.forEach(_ => _.associate(this));
        return this;
    }

    /**
     * Snaps to available unit on the grid.
     * @param coordinate
     */
    snap(coordinate: ICoordinate): ICoordinate {

        const errorMessage = "Somehow I fucked up the math. If you see this error, you fucked up the math. Go fix the code";
        const hardCapOnSizeOfGuesses = 4;

        // make a copy
        const c = this.domain.snap(coordinate);

        for (let guessSize = 1; guessSize <= hardCapOnSizeOfGuesses; guessSize++) {

            const xStep = this.domain.x.step * guessSize;
            const yStep = this.domain.y.step * guessSize;

            // make four guesses: right, down, left, up
            const guesses = [
                c.copy.translateBy(xStep, 0), // right - 0 = 0
                c.copy.translateBy(0, yStep), // down (remember svg coordinates) - 1 = 1
                c.copy.translateBy(-xStep, 0), // left - 2 = 0
                c.copy.translateBy(0, -yStep) // up - 3 = 1
            ];

            const acceptedGuesses: ICoordinate[] = [];

            for (let i = 0; acceptedGuesses.length === 0 && i < guesses.length; i++) {

                let guess = guesses[i];

                // I'm being conservative because I can't do math
                if (guess.distance(coordinate) <= Math.max(xStep, yStep)) {

                    acceptedGuesses.push(guess);

                    // if either left or right, guess up and down from THAT one
                    if (i % 2 === 0) {

                        const up = guess.copy.translateBy(0, -yStep);
                        const down = guess.copy.translateBy(0, yStep);

                        // if up is the correct guess, then the next correct guess is up from the original guesses. done. qed bitches
                        if (up.distance(coordinate) <= Math.max(xStep, yStep)) {

                            acceptedGuesses.push(up);
                            acceptedGuesses.push(guesses[3]);

                        } else if (down.distance(coordinate) <= Math.max(xStep, yStep)) {

                            acceptedGuesses.push(down);
                            acceptedGuesses.push(guess[1]);

                        } else throw new Error(errorMessage);


                    }
                    // if either up or down, guess left and right from that one
                    else if (i % 2 === 1) {

                        const right = guess.copy.translateBy(xStep, 0);
                        const left = guess.copy.translateBy(-xStep, 0);

                        // if up is the correct guess, then the next correct guess is up from the original guesses. done. qed bitches
                        if (right.distance(coordinate) <= Math.max(xStep, yStep)) {

                            acceptedGuesses.push(right);
                            acceptedGuesses.push(guesses[0]);

                        } else if (left.distance(coordinate) <= Math.max(xStep, yStep)) {

                            acceptedGuesses.push(left);
                            acceptedGuesses.push(guess[2]);

                        } else throw new Error(errorMessage);

                    } else throw new Error("hey hey hey I fucked up the iteration indexes!");

                    /*
                     * From 1 guess and its associated orientation, we
                     * can make 2 additional guesses. From whichever guess is the
                     * most appropriate, we can then infer which of the last guesses
                     * is correct. We can then break from the iteration, because we're only guessing
                     * 1 step away from the position of the original coordinate.
                     */
                    break;

                }

            }

            // now we check if any of the accepted guesses overlap with surrounding nodes and filter them out
            const inVicinity = this.getNodesInVicinity(coordinate, Math.max(xStep, yStep));

            // ...and return the first one that doesn't
            for (let i = 0; i < acceptedGuesses.length; i++) {

                // every node in vicinity must NOT overlap with this guess.
                if (inVicinity.every(node => !guesses[i].overlaps(node))) {
                    return guesses[i];
                }

            }

            // now, if none of them work, we have to try larger and larger steps. I know, not exhaustive, but close enough

        }
    }


}

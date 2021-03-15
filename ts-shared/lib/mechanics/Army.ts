/**
 * This is what the player controls.
 */
import {FootSoldier, IPawn} from "./Pawn";
import {Base} from "./Base";

export class Army {

    readonly id: string;
    private readonly pawns: Map<string, IPawn> = new Map<string, IPawn>();
    private readonly bases: Base[] = []

    private _totalUnitsProduced: number;

    /**
     * Returns total amount of units produced since the beginning of the game.
     */
    get totalUnitsProduced(): number {
        return this._totalUnitsProduced;
    }

    /**
     * Get all pawns in this Army's possession.
     */
    get all(): Iterable<IPawn> {
        return this.pawns.values();
    }

    constructor(id: string) {
        this.id = id;
    }

    /**
     * Foot soldiers must have unique IDs.
     * @param fs
     */
    addFootSoldier(fs: FootSoldier): void {
        this.pawns.set(fs.id, fs);
    }

    /**
     * Returns first base that has capacity below occupation a position where
     * a pawn may be placed at, or undefined if no bases are available
     */
    getNextAvailableBase(): Base | undefined {
        return this.bases.find(b => b.occupation < b.capacity);
    }

}

export interface IArmyPossession {

    /**
     * Returns the army that possesses this object.
     */
    readonly belongsTo: Army;

}

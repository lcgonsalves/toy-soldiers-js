import LocationNode from "../graph/LocationNode";
import {Base, IBase} from "./Base";
import {Army, IArmyPossession} from "./Army";
import {Coordinate} from "../geometry/Coordinate";

const FootSoldierKey = "foot_soldier";

/**
 * Most basic description of an actor in the game. Pawns may stay in Bases, move through Roads,
 * interact with other Pawns, and other actions. Pawns have health and will die when its HP reaches zero.
 * Each Pawn implementation has to define how those stats behave.
 */
export class FootSoldier extends LocationNode implements IPawn, IArmyPossession {
    readonly key: string = FootSoldierKey;

    private _hp: number = MAX_HP;
    private _base: Base;

    constructor(belongsTo: Army) {
        super(PawnID(belongsTo, FootSoldierKey), Coordinate.origin, name);
        this.belongsTo = belongsTo;

        const startingBase = belongsTo.getNextAvailableBase();
        if (startingBase) this.occupy(startingBase);

    }

    readonly belongsTo: Army;

    get hp(): number {
        return this._hp;
    }
    get base(): Base {
        return this._base;
    }

    damage(hp: number): void {
        const subtract = hp < 0 ? -hp : hp;

        if (this.hp - subtract < 0) this._hp = 0;
        else this._hp -= subtract;

    }

    heal(hp: number): void {
        const add = hp < 0 ? -hp : hp;

        if (this.hp + add > MAX_HP) this._hp = MAX_HP;
        else this._hp += add;

    }

    leave(): void {
        this._base = undefined;
    }

    occupy(base: Base): void {
        // TODO: actually implement
        this._base = base;
    }

}

/**
 * Most basic description of an actor in the game. Pawns may stay in Bases, move through Roads,
 * interact with other Pawns, and other actions. Pawns have health and will die when its HP reaches zero.
 * Each Pawn implementation has to define how those stats behave.
 */
export interface IPawn {

    /** identifier for kind of pawn */
    readonly key: string;

    /** amount of health points the pawn has */
    readonly hp: number;

    /** Reduces the HP by given amount */
    damage(hp: number): void;

    /** Increases HP by given amount, up to max. */
    heal(hp: number): void;

    /** the base the pawn occupies */
    readonly base: IBase | undefined;

    /** Attempts to occupy a base if unnocupied. If occupied by an opposing Army, this will trigger an engagement */
    occupy(base: IBase): void;

    /** Leaves the current base. Called before occupying another base. */
    leave(): void;

}

export const PawnID = (a: Army, key: string): string => `${a.id}_${key}_${a.totalUnitsProduced}`

export const MAX_HP: number = 100;

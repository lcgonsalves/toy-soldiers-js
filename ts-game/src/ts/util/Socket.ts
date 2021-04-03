import {ICoordinate, IMovable} from "ts-shared/build/geometry/Coordinate";
import {IDepictable} from "../game/units/mixins/Depictable";
import {ICopiable} from "ts-shared/build/util/ISerializable";
import {IClickable, IHoverable, ITrackable} from "ts-shared/build/reactivity/IReactive";

/**
 * Not sure what to do with this yet but feel like could come in handy.
 */
export type ISocket = IDepictable & IMovable & ICopiable & IClickable<ICoordinate> & IHoverable<ICoordinate> & ITrackable & ICoordinate;
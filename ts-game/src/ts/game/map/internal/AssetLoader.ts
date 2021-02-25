import {svg} from "d3-fetch";
import {ICoordinate} from "ts-shared/build/lib/geometry/Coordinate";
import SVGAttrs from "../../../util/SVGAttrs";
import Rectangle from "ts-shared/build/lib/geometry/Rectangle";

/**
 * Component responsible for loading backend assets into the front end.
 */
class AssetLoader {

    public readonly icons: Map<string, HTMLElement> = new Map<string, HTMLElement>();

    // these should be complied to by the assets to avoid problems
    public defaultWidth: number = 10;
    public defaultHeight: number = 10;
    public defaultViewBoxDimensions: [number, number] = [10, 10];

    // this is just so we have a default set for error catching
    public defaultScale: number = 1.0;

    public get ICON_CLS(): string { return "asset_icon" };

    /**
     * Loads all basic assets on initialization.
     */
    constructor() {

        const iconNames = [
            "connect"
        ];

        // define here all asset strings
        iconNames.forEach(assetName => svg("/images/" + assetName).then(_ => {

            const e = _.documentElement;
            e.setAttribute("class", this.ICON_CLS);

            this.icons.set(assetName, e);

        }));

    }

    /**
     * Returns icon placed within the required bounds.
     *
     * @param iconName
     * @param bounds
     */
    getIcon(iconName: string, bounds: Rectangle): HTMLElement | undefined {
        const i = this.icons.get(iconName);
        i?.setAttribute(SVGAttrs.x, bounds.topLeft.x.toString());
        i?.setAttribute(SVGAttrs.y, bounds.topRight.y.toString());

        var regex = /[+-]?\d+(\.\d+)?/g;

        const wOption =  i?.getAttribute(SVGAttrs.width);
        const width = parseInt(wOption ? wOption : this.defaultWidth.toString());

        const hOption =  i?.getAttribute(SVGAttrs.height);
        const height = parseInt(hOption ? hOption : this.defaultHeight.toString());

        let transform: string = this.defaultScale.toString();
        let child: Element | undefined;

        if (i && i.children.length > 0) {
            child = i.children[0];
            const transformOpt = child.getAttribute(SVGAttrs.transform);
            transform = transformOpt ? transformOpt : this.defaultScale.toString();
        }

        const scaleOption = transform.match(regex)?.map(_ => parseFloat(_)).pop();
        const scale = scaleOption ? scaleOption : this.defaultScale;

        // find how much bigger/smaller we need to be
        const xRatio = bounds.width / width;
        const yRatio = bounds.height / height;

        // if we are BIGGER than bounds, then we need to SHRING (number is small, you idiot)
        let newScale = scale * Math.min(xRatio, yRatio);
        const newWidth = width * xRatio,
              newHeight = height * yRatio;

        // update <g> scale
        child?.setAttribute(SVGAttrs.transform, `scale(${newScale})`);

        // update viewbox
        const [vboxX, vboxY] = this.defaultViewBoxDimensions;
        i?.setAttribute(SVGAttrs.viewbox, `0 0 ${newWidth > vboxX ? newWidth : vboxX} ${newHeight > vboxY ? newHeight : vboxY}`);

        // now we set the size
        i?.setAttribute(SVGAttrs.width, (newWidth > this.defaultWidth ? newWidth : this.defaultWidth) + "px");
        i?.setAttribute(SVGAttrs.height, (newHeight > this.defaultHeight ? newHeight : this.defaultHeight) + "px");


        return i;
    }

}

export default new AssetLoader();

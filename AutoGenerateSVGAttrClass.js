// I can't be bothered to copy paste this stuff

const fs = require("fs");

const input = {
    "a": "SVGAElement",
    "circle": "SVGCircleElement",
    "clipPath": "SVGClipPathElement",
    "defs": "SVGDefsElement",
    "desc": "SVGDescElement",
    "ellipse": "SVGEllipseElement",
    "feBlend": "SVGFEBlendElement",
    "feColorMatrix": "SVGFEColorMatrixElement",
    "feComponentTransfer": "SVGFEComponentTransferElement",
    "feComposite": "SVGFECompositeElement",
    "feConvolveMatrix": "SVGFEConvolveMatrixElement",
    "feDiffuseLighting": "SVGFEDiffuseLightingElement",
    "feDisplacementMap": "SVGFEDisplacementMapElement",
    "feDistantLight": "SVGFEDistantLightElement",
    "feFlood": "SVGFEFloodElement",
    "feFuncA": "SVGFEFuncAElement",
    "feFuncB": "SVGFEFuncBElement",
    "feFuncG": "SVGFEFuncGElement",
    "feFuncR": "SVGFEFuncRElement",
    "feGaussianBlur": "SVGFEGaussianBlurElement",
    "feImage": "SVGFEImageElement",
    "feMerge": "SVGFEMergeElement",
    "feMergeNode": "SVGFEMergeNodeElement",
    "feMorphology": "SVGFEMorphologyElement",
    "feOffset": "SVGFEOffsetElement",
    "fePointLight": "SVGFEPointLightElement",
    "feSpecularLighting": "SVGFESpecularLightingElement",
    "feSpotLight": "SVGFESpotLightElement",
    "feTile": "SVGFETileElement",
    "feTurbulence": "SVGFETurbulenceElement",
    "filter": "SVGFilterElement",
    "foreignObject": "SVGForeignObjectElement",
    "g": "SVGGElement",
    "image": "SVGImageElement",
    "line": "SVGLineElement",
    "linearGradient": "SVGLinearGradientElement",
    "marker": "SVGMarkerElement",
    "mask": "SVGMaskElement",
    "metadata": "SVGMetadataElement",
    "path": "SVGPathElement",
    "pattern": "SVGPatternElement",
    "polygon": "SVGPolygonElement",
    "polyline": "SVGPolylineElement",
    "radialGradient": "SVGRadialGradientElement",
    "rect": "SVGRectElement",
    "script": "SVGScriptElement",
    "stop": "SVGStopElement",
    "style": "SVGStyleElement",
    "svg": "SVGSVGElement",
    "switch": "SVGSwitchElement",
    "symbol": "SVGSymbolElement",
    "text": "SVGTextElement",
    "textPath": "SVGTextPathElement",
    "title": "SVGTitleElement",
    "tspan": "SVGTSpanElement",
    "use": "SVGUseElement",
    "view": "SVGViewElement",
}

function objectFlip(obj) {
    const ret = {};
    Object.keys(obj).forEach(key => {
        ret[obj[key]] = key;
    });
    return ret;
}

const tags = Object.keys(input);
const svgTagName = Object.values(input);

const out = `abstract class SVGTags {
    ${tags.map( (t, i) => `public static readonly ${svgTagName[i]}: string = "${t}";`).join("\n    ")}
}`


console.log("Auto generating key value map...");

fs.writeFile(__dirname + "/ts-game/src/ts/util/SVGTags.ts", out, err => {
    if (err) console.error(err);
    console.log("Done!")
});

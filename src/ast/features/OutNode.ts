import Node from "../base/Node.js";
import NodeType from "../base/node-types.js";
import Pos from "../base/Pos.js";
import { RawChildNode } from "../base/parse5-types.js";
import { isRawElementNode, isRawTextNode } from "../base/parse5-type-guards.js";
import { getAtAttributes, getPos } from "../../utils/utils.js";

class OutNode extends Node {
    public data: string;
    public isRaw: boolean;

    constructor(data: string, isRaw: boolean, pos: Pos) {
        super(NodeType.Out, pos);
        this.data = data;
        this.isRaw = isRaw;
    }

    public getChildren(): Node[] {
        return [];
    }

    public static newFromRawNode(node: RawChildNode, fileName: string): Node | null {
        if (!isRawElementNode(node)) {
            throw new Error(
                `Expected an element node but found '${node.nodeName}'. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`
            );
        }

        if (node.tagName !== "out") {
            throw new Error(
                `Expected element tag name 'content' but found '${node.tagName}'. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`
            );
        }

        const atAttrs = getAtAttributes(node, fileName);
        if (atAttrs.length > 1) {
            throw new Error(
                `Multiple @ attributes on <out> tag are not allowed: found [${atAttrs.map(a => a.name).join(", ")}]. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`
            );
        }

        if (node.childNodes.length === 0) return null;

        let outData: string = "";

        for (const child of node.childNodes) {
            if (!isRawTextNode(child)) {
                throw new Error(
                    `Invalid child node inside <out>: found '${child.nodeName}' but only text or comment nodes are allowed. ` +
                    `File: ${fileName}, Line: ${child.sourceCodeLocation?.startLine ?? "?"}, Col: ${child.sourceCodeLocation?.startCol ?? "?"}`
                );
            }

            outData += child.value;
        }
        
        const isRaw = atAttrs.length > 0 ? atAttrs[0].name === "raw" ? true : false : false;
        const pos = getPos(node, fileName);

        return new OutNode(outData, isRaw, pos);
    }
}

export default OutNode;
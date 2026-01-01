import Node from "../base/Node.js";
import NodeType from "../base/node-types.js";
import Pos from "../base/Pos.js";
import { isRawElementNode, isRawTextNode } from "../base/parse5-type-guards.js";
import { getAtAttributes, getPos } from "../../utils/utils.js";
import { RawChildNode } from "../base/parse5-types.js";

class LogicNode extends Node {
    public lang: string;
    public data: string;

    constructor(lang: string, data: string, pos: Pos) {
        super(NodeType.Logic, pos);
        this.lang = lang;
        this.data = data;
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

        if (node.tagName !== "logic") {
            throw new Error(
                `Expected element tag name 'logic' but found '${node.tagName}'. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`
            );
        }

        const atAttrs = getAtAttributes(node, fileName);
        if (atAttrs.length < 1) {
            throw new Error(
                `Missing @[lang] attribute on <logic> tag. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`
            );
        } else if (atAttrs.length > 1) {
            throw new Error(
                `Multiple @ attributes on <logic> tag are not allowed: found [${atAttrs.map(a => a.name).join(", ")}]. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`
            );
        }

        if (node.childNodes.length === 0) return null;

        let outData: string = "";

        for (const child of node.childNodes) {
            if (!isRawTextNode(child)) {
                throw new Error(
                    `Invalid child node inside <logic>: found '${child.nodeName}' but only text or comment nodes are allowed. ` +
                    `File: ${fileName}, Line: ${child.sourceCodeLocation?.startLine ?? "?"}, Col: ${child.sourceCodeLocation?.startCol ?? "?"}`
                );
            }

            outData += child.value;
        }

        const pos = getPos(node, fileName);

        return new LogicNode(atAttrs[0].name, outData, pos);
    }
}

export default LogicNode;
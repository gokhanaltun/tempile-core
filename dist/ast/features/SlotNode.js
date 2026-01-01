import Node from "../base/Node.js";
import NodeType from "../base/node-types.js";
import { isRawElementNode } from "../base/parse5-type-guards.js";
import { getAtAttributes, getPos } from "../../utils/utils.js";
class SlotNode extends Node {
    name;
    children;
    constructor(name, children, pos) {
        super(NodeType.Slot, pos);
        this.name = name;
        this.children = children;
    }
    getChildren() {
        return this.children;
    }
    static newFromRawNode(node, fileName, rawAstParserFn) {
        if (!isRawElementNode(node)) {
            throw new Error(`Expected an element node but found '${node.nodeName}'. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`);
        }
        if (node.tagName !== "slot") {
            throw new Error(`Expected element tag name 'slot' but found '${node.tagName}'. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`);
        }
        const atAttrs = getAtAttributes(node, fileName);
        if (atAttrs.length < 1) {
            throw new Error(`Missing @[name] attribute on <slot> tag. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`);
        }
        else if (atAttrs.length > 1) {
            throw new Error(`Multiple @ attributes on <slot> tag are not allowed: found [${atAttrs.map(a => a.name).join(", ")}]. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`);
        }
        const children = rawAstParserFn(node.childNodes, fileName);
        const pos = getPos(node, fileName);
        return new SlotNode(atAttrs[0].value, children, pos);
    }
}
export default SlotNode;

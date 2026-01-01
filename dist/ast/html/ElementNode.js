import Node from "../base/Node.js";
import NodeType from "../base/node-types.js";
import { isRawElementNode } from "../base/parse5-type-guards.js";
import { getNonAtAttributes, getPos } from "../../utils/utils.js";
class ElementNode extends Node {
    tag;
    attrs;
    children;
    constructor(tag, attrs, children, pos) {
        super(NodeType.Element, pos);
        this.tag = tag;
        this.children = children;
        this.attrs = attrs;
    }
    getChildren() {
        return this.children;
    }
    static newFromRawNode(node, fileName, rawAstParserFn) {
        if (!isRawElementNode(node)) {
            throw new Error(`Expected an element node but found '${node.nodeName}'. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`);
        }
        const nonAtAttrs = getNonAtAttributes(node, fileName);
        const children = rawAstParserFn(node.childNodes, fileName);
        const pos = getPos(node, fileName);
        return new ElementNode(node.tagName, nonAtAttrs, children, pos);
    }
}
export default ElementNode;

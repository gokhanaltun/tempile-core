import Node from "../base/Node.js";
import NodeType from "../base/node-types.js";
import { isRawElementNode } from "../base/parse5-type-guards.js";
import { getAtAttributes, getPos } from "../../utils/utils.js";
class ForNode extends Node {
    loops;
    children;
    constructor(loops, children, pos) {
        super(NodeType.For, pos);
        this.loops = loops;
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
        if (node.tagName !== "for") {
            throw new Error(`Expected element tag name 'for' but found '${node.tagName}'. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`);
        }
        const atAttrs = getAtAttributes(node, fileName);
        if (atAttrs.length < 1) {
            throw new Error(`Missing @[lang] attribute on <for> tag. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`);
        }
        if (node.childNodes.length === 0)
            return null;
        const children = rawAstParserFn(node.childNodes, fileName);
        const pos = getPos(node, fileName);
        return new ForNode(atAttrs, children, pos);
    }
}
export default ForNode;

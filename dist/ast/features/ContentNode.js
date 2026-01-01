import Node from "../base/Node.js";
import NodeType from "../base/node-types.js";
import { getAtAttributes, getPos } from "../../utils/utils.js";
import { isRawElementNode } from "../base/parse5-type-guards.js";
class ContentNode extends Node {
    name;
    children;
    constructor(name, children, pos) {
        super(NodeType.Content, pos);
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
        if (node.tagName !== "content") {
            throw new Error(`Expected element tag name 'content' but found '${node.tagName}'. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`);
        }
        const parentNode = node.parentNode;
        if (!node.parentNode || !parentNode.tagName || parentNode.tagName !== "include") {
            throw new Error(`<content> element can only appear inside an <include> element. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`);
        }
        const atAttrs = getAtAttributes(node, fileName);
        if (atAttrs.length < 1) {
            throw new Error(`Missing @[name] attribute on <content> tag. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`);
        }
        else if (atAttrs.length > 1) {
            throw new Error(`Multiple @ attributes on <content> tag are not allowed: found [${atAttrs.map(a => a.name).join(", ")}]. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`);
        }
        const children = rawAstParserFn(node.childNodes, fileName);
        const pos = getPos(node, fileName);
        return new ContentNode(atAttrs[0].value, children, pos);
    }
}
export default ContentNode;

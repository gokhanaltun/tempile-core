import ElseIfNode from "./ElseIfNode.js";
import ElseNode from "./ElseNode.js";
import Node from "../base/Node.js";
import NodeType from "../base/node-types.js";
import { isRawElementNode } from "../base/parse5-type-guards.js";
import { getAtAttributes, getPos } from "../../utils/utils.js";
class IfNode extends Node {
    conditions;
    ifContent;
    elseIfNodes;
    elseNode;
    constructor(conditions, ifContent, pos, elseIfNodes = [], elseNode) {
        super(NodeType.If, pos);
        this.conditions = conditions;
        this.ifContent = ifContent;
        this.elseIfNodes = elseIfNodes;
        this.elseNode = elseNode;
    }
    getChildren() {
        return this.ifContent;
    }
    static newFromRawNode(node, fileName, rawAstParserFn) {
        if (!isRawElementNode(node)) {
            throw new Error(`Expected an element node but found '${node.nodeName}'. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`);
        }
        if (node.tagName !== "if") {
            throw new Error(`Expected element tag name 'if' but found '${node.tagName}'. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`);
        }
        const attributes = getAtAttributes(node, fileName);
        if (attributes.length < 1) {
            throw new Error(`Missing @[lang] attribute on <if> tag. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`);
        }
        const thenChildren = [];
        const elseIfChildren = [];
        let elseNode;
        const children = rawAstParserFn(node.childNodes, fileName);
        for (const child of children) {
            if (child instanceof ElseIfNode) {
                elseIfChildren.push(child);
            }
            else if (child instanceof ElseNode) {
                if (!elseNode) {
                    elseNode = child;
                }
                else {
                    throw new Error(`Multiple <else> blocks are not allowed. ` +
                        `File: ${fileName}, Line: ${child.pos?.startLine}, Col: ${child.pos?.startCol}`);
                }
            }
            else {
                thenChildren.push(child);
            }
        }
        if (thenChildren.length === 0) {
            return null;
        }
        const pos = getPos(node, fileName);
        return new IfNode(attributes, thenChildren, pos, elseIfChildren, elseNode);
    }
}
export default IfNode;

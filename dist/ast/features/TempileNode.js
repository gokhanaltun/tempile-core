import Node from "../base/Node.js";
import NodeType from "../base/node-types.js";
import { isRawElementNode } from "../base/parse5-type-guards.js";
import { getAtAttributes, getNonAtAttributes, getPos } from "../../utils/utils.js";
import DoctypeNode from "../html/DoctypeNode.js";
import { ElementNode } from "../nodes.js";
class TempileNode extends Node {
    nodeTypeData;
    attrs;
    children;
    constructor(nodeTypeData, attrs, children, pos) {
        super(NodeType.Tempile, pos);
        this.nodeTypeData = nodeTypeData;
        this.attrs = attrs;
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
        if (node.tagName !== "tempile") {
            throw new Error(`Expected element tag name 'tempile' but found '${node.tagName}'. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`);
        }
        const atAttrs = getAtAttributes(node, fileName);
        if (atAttrs.length < 1) {
            throw new Error(`Missing @[type] attribute on <tempile> tag. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`);
        }
        else if (atAttrs.length > 1) {
            throw new Error(`Multiple @ attributes on <tempile> tag are not allowed: found [${atAttrs.map(a => a.name).join(", ")}]. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`);
        }
        const nodeTypeAttr = atAttrs[0].name;
        const allowedAttrs = ["doctype", "html", "head", "body"];
        if (!allowedAttrs.includes(nodeTypeAttr)) {
            throw new Error(`Invalid @ attribute '${nodeTypeAttr}' on <tempile> tag. Expected one of: ${allowedAttrs.join(", ")}. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`);
        }
        const nonAtAttrs = getNonAtAttributes(node, fileName);
        const children = rawAstParserFn(node.childNodes, fileName);
        const pos = getPos(node, fileName);
        if (nodeTypeAttr === "doctype") {
            return new DoctypeNode("<!DOCTYPE html>", pos);
        }
        return new ElementNode(nodeTypeAttr, nonAtAttrs, children, pos);
    }
}
export default TempileNode;

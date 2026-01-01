import NodeType from "./node-types.js";
import { RawChildNode, RawCommentNode, RawElementNode, RawTextNode } from "./parse5-types.js";

export function isRawTextNode(node: RawChildNode): node is RawTextNode {
    return node.nodeName === "#text";
}

export function isRawCommentNode(node: RawChildNode): node is RawCommentNode {
    return node.nodeName === "#comment";
}

export function isRawElementNode(node: RawChildNode): node is RawElementNode {
    return "tagName" in node;
}

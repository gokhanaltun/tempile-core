import { RawChildNode, RawCommentNode, RawElementNode, RawTextNode } from "./parse5-types.js";
export declare function isRawTextNode(node: RawChildNode): node is RawTextNode;
export declare function isRawCommentNode(node: RawChildNode): node is RawCommentNode;
export declare function isRawElementNode(node: RawChildNode): node is RawElementNode;

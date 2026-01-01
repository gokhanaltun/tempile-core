import Node from "../base/Node.js";
import Pos from "../base/Pos.js";
import { RawChildNode } from "../base/parse5-types.js";
declare class TextNode extends Node {
    data: string;
    constructor(data: string, pos: Pos);
    getChildren(): Node[];
    static newFromRawNode(node: RawChildNode, fileName: string): Node;
}
export default TextNode;

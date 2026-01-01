import Node from "../base/Node.js";
import Pos from "../base/Pos.js";
import { RawChildNode } from "../base/parse5-types.js";
declare class LogicNode extends Node {
    lang: string;
    data: string;
    constructor(lang: string, data: string, pos: Pos);
    getChildren(): Node[];
    static newFromRawNode(node: RawChildNode, fileName: string): Node | null;
}
export default LogicNode;

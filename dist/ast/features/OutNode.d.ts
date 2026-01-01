import Node from "../base/Node.js";
import Pos from "../base/Pos.js";
import { RawChildNode } from "../base/parse5-types.js";
declare class OutNode extends Node {
    data: string;
    isRaw: boolean;
    constructor(data: string, isRaw: boolean, pos: Pos);
    getChildren(): Node[];
    static newFromRawNode(node: RawChildNode, fileName: string): Node | null;
}
export default OutNode;

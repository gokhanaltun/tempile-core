import Node from "../base/Node.js";
import Pos from "../base/Pos.js";
declare class DoctypeNode extends Node {
    data: string;
    constructor(data: string, pos: Pos);
    getChildren(): Node[];
}
export default DoctypeNode;

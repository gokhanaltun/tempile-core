import NodeType from "./node-types.js";
import Pos from "./Pos.js";
declare abstract class Node {
    type: NodeType;
    pos: Pos | null | undefined;
    constructor(type: NodeType, pos: Pos | null | undefined);
    abstract getChildren(): Node[];
}
export default Node;

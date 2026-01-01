import NodeType from "./node-types.js";
import Pos from "./Pos.js";

abstract class Node {
	public type: NodeType;
    public pos: Pos | null | undefined;
    
    constructor(type: NodeType, pos: Pos | null | undefined) {
        this.type = type;
        this.pos = pos;
    }

    abstract getChildren(): Node[];
}

export default Node;
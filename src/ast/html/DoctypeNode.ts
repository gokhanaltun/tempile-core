import Node from "../base/Node.js";
import NodeType from "../base/node-types.js";
import Pos from "../base/Pos.js";

class DoctypeNode extends Node {
    public data: string;

    constructor(data: string, pos: Pos) {
        super(NodeType.Doctype, pos);
        this.data = data;
    }

    public getChildren(): Node[] {
        return [];
    }
}

export default DoctypeNode;
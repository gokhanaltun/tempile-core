import Node from "../base/Node.js";
import NodeType from "../base/node-types.js";
class DoctypeNode extends Node {
    data;
    constructor(data, pos) {
        super(NodeType.Doctype, pos);
        this.data = data;
    }
    getChildren() {
        return [];
    }
}
export default DoctypeNode;

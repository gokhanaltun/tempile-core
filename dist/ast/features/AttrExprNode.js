import Node from "../base/Node.js";
import NodeType from "../base/node-types.js";
class AttrExprNode extends Node {
    data;
    constructor(data, pos) {
        super(NodeType.Out, pos);
        this.data = data;
    }
    getChildren() {
        return [];
    }
}
export default OutNode;

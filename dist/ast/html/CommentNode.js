import Node from "../base/Node.js";
import NodeType from "../base/node-types.js";
import { isRawCommentNode } from "../base/parse5-type-guards.js";
import { getPos } from "../../utils/utils.js";
class CommentNode extends Node {
    data;
    constructor(data, pos) {
        super(NodeType.Comment, pos);
        this.data = data;
    }
    getChildren() {
        return [];
    }
    static newFromRawNode(node, fileName) {
        if (!isRawCommentNode(node)) {
            throw new Error(`Expected an comment node but found '${node.nodeName}'. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`);
        }
        const pos = getPos(node, fileName);
        return new CommentNode(node.data, pos);
    }
}
export default CommentNode;

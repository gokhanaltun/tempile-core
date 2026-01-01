import Node from "../base/Node.js";
import NodeType from "../base/node-types.js";
import { isRawTextNode } from "../base/parse5-type-guards.js";
import { getPos } from "../../utils/utils.js";
class TextNode extends Node {
    data;
    constructor(data, pos) {
        super(NodeType.Text, pos);
        this.data = data;
    }
    getChildren() {
        return [];
    }
    static newFromRawNode(node, fileName) {
        if (!isRawTextNode(node)) {
            throw new Error(`Expected an text node but found '${node.nodeName}'. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`);
        }
        const pos = getPos(node, fileName);
        return new TextNode(node.value, pos);
    }
}
export default TextNode;

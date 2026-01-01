import Node from "../base/Node.js";
import NodeType from "../base/node-types.js";
import Pos from "../base/Pos.js";
import { RawChildNode } from "../base/parse5-types.js";
import { isRawTextNode } from "../base/parse5-type-guards.js";
import { getPos } from "../../utils/utils.js";

class TextNode extends Node {
    public data: string;

    constructor(data: string, pos: Pos) {
        super(NodeType.Text, pos);
        this.data = data;
    }

    public getChildren(): Node[] {
        return [];
    }

    public static newFromRawNode(node: RawChildNode, fileName: string): Node {
        if (!isRawTextNode(node)) {
            throw new Error(
                `Expected an text node but found '${node.nodeName}'. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`
            );
        }

        const pos = getPos(node, fileName);
        
        return new TextNode(node.value, pos);
    }
}

export default TextNode;
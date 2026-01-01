import Node from "../base/Node.js";
import NodeType from "../base/node-types.js";
import Pos from "../base/Pos.js";
import { isRawElementNode } from "../base/parse5-type-guards.js";
import { RawChildNode } from "../base/parse5-types.js";
import { RawASTParserFunction } from "../base/parser-types.js";
import { getPos } from "../../utils/utils.js";

class ElseNode extends Node {
    public children: Node[];

    constructor(children: Node[], pos: Pos) {
        super(NodeType.Else, pos);
        this.children = children;
    }

    public getChildren(): Node[] {
        return this.children;
    }

    public static newFromRawNode(node: RawChildNode, fileName: string, rawAstParserFn: RawASTParserFunction): Node | null {
        if (!isRawElementNode(node)) {
            throw new Error(
                `Expected an element node but found '${node.nodeName}'. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`
            );
        }

        if (node.tagName !== "else") {
            throw new Error(
                `Expected element tag name 'else' but found '${node.tagName}'. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`
            );
        }

        if (!node.parentNode || node.parentNode.nodeName !== "if") {
            throw new Error(
                `<else> must be a child of <if>. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`
            );
        }

        if (node.childNodes.length === 0) return null;

        const children = rawAstParserFn(node.childNodes, fileName);
        const pos = getPos(node, fileName);

        return new ElseNode(children, pos);
    }
}

export default ElseNode;
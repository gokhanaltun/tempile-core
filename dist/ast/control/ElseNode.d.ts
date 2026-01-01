import Node from "../base/Node.js";
import Pos from "../base/Pos.js";
import { RawChildNode } from "../base/parse5-types.js";
import { RawASTParserFunction } from "../base/parser-types.js";
declare class ElseNode extends Node {
    children: Node[];
    constructor(children: Node[], pos: Pos);
    getChildren(): Node[];
    static newFromRawNode(node: RawChildNode, fileName: string, rawAstParserFn: RawASTParserFunction): Node | null;
}
export default ElseNode;

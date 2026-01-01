import { Attribute } from "../html/Attribute.js";
import ElseIfNode from "./ElseIfNode.js";
import ElseNode from "./ElseNode.js";
import Node from "../base/Node.js";
import Pos from "../base/Pos.js";
import { RawChildNode } from "../base/parse5-types.js";
import { RawASTParserFunction } from "../base/parser-types.js";
declare class IfNode extends Node {
    conditions: Attribute[];
    ifContent: Node[];
    elseIfNodes: ElseIfNode[];
    elseNode?: ElseNode;
    constructor(conditions: Attribute[], ifContent: Node[], pos: Pos, elseIfNodes?: ElseIfNode[], elseNode?: ElseNode);
    getChildren(): Node[];
    static newFromRawNode(node: RawChildNode, fileName: string, rawAstParserFn: RawASTParserFunction): Node | null;
}
export default IfNode;

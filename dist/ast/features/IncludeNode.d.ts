import Node from "../base/Node.js";
import Pos from "../base/Pos.js";
import { RawChildNode } from "../base/parse5-types.js";
import { RawASTParserFunction } from "../base/parser-types.js";
import { Attribute } from "../html/Attribute.js";
declare class IncludeNode extends Node {
    ctxId: string;
    path: Attribute;
    children: Node[];
    constructor(ctxId: string, path: Attribute, children: Node[], pos: Pos);
    getChildren(): Node[];
    static newFromRawNode(node: RawChildNode, fileName: string, rawAstParserFn: RawASTParserFunction): Node;
}
export default IncludeNode;

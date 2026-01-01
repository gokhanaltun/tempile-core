import Node from "../base/Node.js";
import Pos from "../base/Pos.js";
import { Attribute } from "./Attribute.js";
import { RawChildNode } from "../base/parse5-types.js";
import { RawASTParserFunction } from "../base/parser-types.js";
declare class ElementNode extends Node {
    tag: string;
    attrs: Attribute[];
    children: Node[];
    constructor(tag: string, attrs: Attribute[], children: Node[], pos: Pos);
    getChildren(): Node[];
    static newFromRawNode(node: RawChildNode, fileName: string, rawAstParserFn: RawASTParserFunction): Node;
}
export default ElementNode;

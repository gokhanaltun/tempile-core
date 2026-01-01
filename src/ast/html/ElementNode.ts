import Node from "../base/Node.js";
import NodeType from "../base/node-types.js";
import Pos from "../base/Pos.js";
import {Attribute} from "./Attribute.js";
import { RawChildNode } from "../base/parse5-types.js";
import { isRawElementNode } from "../base/parse5-type-guards.js";
import { getNonAtAttributes, getPos } from "../../utils/utils.js";
import { RawASTParserFunction } from "../base/parser-types.js";

class ElementNode extends Node {
    public tag: string;
    public attrs: Attribute[];
    public children: Node[];

    constructor(tag: string, attrs: Attribute[], children: Node[], pos: Pos) {
        super(NodeType.Element, pos);
        this.tag = tag;
        this.children = children;
        this.attrs = attrs;
    }

    public getChildren(): Node[] {
        return this.children;
    }

    public static newFromRawNode(node: RawChildNode, fileName: string, rawAstParserFn: RawASTParserFunction): Node {
        if (!isRawElementNode(node)) {
            throw new Error(
                `Expected an element node but found '${node.nodeName}'. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`
            );
        }

        const nonAtAttrs = getNonAtAttributes(node, fileName);
        const children = rawAstParserFn(node.childNodes, fileName);
        const pos = getPos(node, fileName);

        return new ElementNode(node.tagName, nonAtAttrs, children, pos);
    }
}

export default ElementNode;
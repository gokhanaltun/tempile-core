import {Attribute} from "../html/Attribute.js";
import Node from "../base/Node.js";
import NodeType from "../base/node-types.js";
import Pos from "../base/Pos.js";
import { isRawElementNode } from "../base/parse5-type-guards.js";
import { RawChildNode } from "../base/parse5-types.js";
import { RawASTParserFunction } from "../base/parser-types.js";
import { getAtAttributes, getPos } from "../../utils/utils.js";

class ElseIfNode extends Node {
    public conditions: Attribute[];
    public children: Node[];

    constructor(conditions: Attribute[], children: Node[], pos: Pos) {
        super(NodeType.ElseIf, pos);
        this.conditions = conditions;
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

        if (node.tagName !== "elseif") {
            throw new Error(
                `Expected element tag name 'elseif' but found '${node.tagName}'. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`
            );
        }

        if (!node.parentNode || node.parentNode.nodeName !== "if") {
            throw new Error(
                `<elseif> must be a child of <if>. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`
            );
        }

        const attributes = getAtAttributes(node, fileName);
        if (attributes.length < 1) {
            throw new Error(
                `Missing @[lang] attribute on <elseif> tag. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`
            );
        }

        if (node.childNodes.length === 0) return null;

        const children = rawAstParserFn(node.childNodes, fileName);
        const pos = getPos(node, fileName);

        return new ElseIfNode(attributes, children, pos);
    }
}

export default ElseIfNode;
import {Attribute} from "../html/Attribute.js";
import ElseIfNode from "./ElseIfNode.js";
import ElseNode from "./ElseNode.js";
import Node from "../base/Node.js";
import NodeType from "../base/node-types.js";
import Pos from "../base/Pos.js";
import { RawChildNode } from "../base/parse5-types.js";
import { RawASTParserFunction } from "../base/parser-types.js";
import { isRawElementNode } from "../base/parse5-type-guards.js";
import { getAtAttributes, getPos } from "../../utils/utils.js";

class IfNode extends Node {
    public conditions: Attribute[];
    public ifContent: Node[];
    public elseIfNodes: ElseIfNode[];
    public elseNode?: ElseNode;

    constructor(
        conditions: Attribute[],
        ifContent: Node[],
        pos: Pos,
        elseIfNodes: ElseIfNode[] = [],
        elseNode?: ElseNode
    ) {
        super(NodeType.If, pos);
        this.conditions = conditions;
        this.ifContent = ifContent;
        this.elseIfNodes = elseIfNodes;
        this.elseNode = elseNode;
    }

    public getChildren(): Node[] {
        return this.ifContent;
    }

    public static newFromRawNode(node: RawChildNode, fileName: string, rawAstParserFn: RawASTParserFunction): Node | null {
        if (!isRawElementNode(node)) {
            throw new Error(
                `Expected an element node but found '${node.nodeName}'. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`
            );
        }

        if (node.tagName !== "if") {
            throw new Error(
                `Expected element tag name 'if' but found '${node.tagName}'. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`
            );
        }

        const attributes = getAtAttributes(node, fileName);
        if (attributes.length < 1) {
            throw new Error(
                `Missing @[lang] attribute on <if> tag. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`
            );
        }

        const thenChildren: Node[] = [];
        const elseIfChildren: ElseIfNode[] = [];
        let elseNode: ElseNode | undefined;

        const children = rawAstParserFn(node.childNodes, fileName);
        for (const child of children) {
            if (child instanceof ElseIfNode) {
                elseIfChildren.push(child);
            } else if (child instanceof ElseNode) {
                if (!elseNode) {
                    elseNode = child;
                } else {
                    throw new Error(
                        `Multiple <else> blocks are not allowed. ` +
                        `File: ${fileName}, Line: ${child.pos?.startLine}, Col: ${child.pos?.startCol}`
                    );
                }
            } else {
                thenChildren.push(child);
            }
        }

        if (thenChildren.length === 0) {
            return null;
        }

        const pos = getPos(node, fileName);
        return new IfNode(attributes, thenChildren, pos, elseIfChildren, elseNode);
    }
}

export default IfNode;
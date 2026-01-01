import Node from "../base/Node.js";
import NodeType from "../base/node-types.js";
import Pos from "../base/Pos.js";
import { isRawElementNode } from "../base/parse5-type-guards.js";
import { RawChildNode } from "../base/parse5-types.js";
import { generateCtxId, getAtAttributes, getPos } from "../../utils/utils.js";
import { RawASTParserFunction } from "../base/parser-types.js";
import {Attribute} from "../html/Attribute.js";

class IncludeNode extends Node {
    public ctxId: string;
    public path: Attribute;
    public children: Node[];

    constructor(
        ctxId: string,
        path: Attribute,
        children: Node[],
        pos: Pos
    ) {
        super(NodeType.Include, pos);
        this.ctxId = ctxId;
        this.path = path;
        this.children = children;
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

        if (node.tagName !== "include") {
            throw new Error(
                `Expected element tag name 'include' but found '${node.tagName}'. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`
            );
        }

        const atAttrs = getAtAttributes(node, fileName);
        if (atAttrs.length < 1) {
            throw new Error(
                `Missing @[path] attribute on <include> tag. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`
            );
        } else if (atAttrs.length > 1) {
            throw new Error(
                `Multiple @ attributes on <include> tag are not allowed: found [${atAttrs.map(a => a.name).join(", ")}]. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`
            );
        }

        const children = rawAstParserFn(node.childNodes, fileName);
        const ctxId = generateCtxId();
        const pos = getPos(node, fileName);

        return new IncludeNode(ctxId, atAttrs[0], children, pos);
    }
}

export default IncludeNode;
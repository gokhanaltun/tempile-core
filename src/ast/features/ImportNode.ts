import Node from "../base/Node.js";
import NodeType from "../base/node-types.js";
import Pos from "../base/Pos.js";
import { RawChildNode } from "../base/parse5-types.js";
import { isRawCommentNode, isRawElementNode, isRawTextNode } from "../base/parse5-type-guards.js";
import { RawASTParserFunction } from "../base/parser-types.js";
import { getAtAttributes, getPos } from "../../utils/utils.js";

class ImportNode extends Node {
    public lang: string;
    public data: Node[];

    constructor(
        lang: string,
        data: Node[],
        pos: Pos
    ) {
        super(NodeType.Import, pos);
        this.lang = lang;
        this.data = data;
    }

    public getChildren(): Node[] {
        return this.data;
    }

    public static newFromRawNode(node: RawChildNode, fileName: string, rawAstParserFn: RawASTParserFunction): Node {
        if (!isRawElementNode(node)) {
            throw new Error(
                `Expected an element node but found '${node.nodeName}'. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`
            );
        }

        if (node.tagName !== "import") {
            throw new Error(
                `Expected element tag name 'import' but found '${node.tagName}'. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine}, Col: ${node.sourceCodeLocation?.startCol}`
            );
        }

        if (node.parentNode && node.parentNode.nodeName !== "#document-fragment") {
            throw new Error(
                `<import> node cannot be a child of another element. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`
            );
        }

        if (node.childNodes.length > 0) {
            for (const n of node.childNodes) {
                if (!isRawTextNode(n) && !isRawCommentNode(n)) {
                    throw new Error(
                        `Invalid child node inside <import>: found '${n.nodeName}' but only text or comment nodes are allowed. ` +
                        `File: ${fileName}, Line: ${n.sourceCodeLocation?.startLine ?? "?"}, Col: ${n.sourceCodeLocation?.startCol ?? "?"}`
                    );
                }
            }
        }

        const attributes = getAtAttributes(node, fileName);
        if (attributes.length === 0) {
            throw new Error(
                `Missing @[lang] attribute on <import> tag. ` +
                `File: ${fileName}, Line: ${node.sourceCodeLocation?.startLine ?? "?"}, Col: ${node.sourceCodeLocation?.startCol ?? "?"}`
            );
        }

        if (attributes.length > 1) {
            throw new Error(
                `Multiple @ attributes on <import> tag are not allowed: found [${attributes.map(a => a.name).join(", ")}]. ` +
                `File: ${fileName}, line ${node.sourceCodeLocation?.startLine ?? "?"}, col ${node.sourceCodeLocation?.startCol ?? "?"}`
            );
        }

        const childNodes = rawAstParserFn(node.childNodes, fileName);
        const pos = getPos(node, fileName);

        return new ImportNode(attributes[0].name, childNodes, pos);
    }

}

export default ImportNode;
import { RawChildNode, RawElementNode } from "../ast/base/parse5-types.js";
import Pos from "../ast/base/Pos.js";
import {Attribute, AttrValueNode} from "../ast/html/Attribute.js";

export function getAtAttributes(node: RawElementNode, fileName: string): Attribute[] {
    return node.attrs
        .filter(attr => attr.name.startsWith("@"))
        .map(attr => ({
            name: attr.name.slice(1),
            value: attr.value,
            pos: getAttrPos(node, attr.name, fileName),
            valueNodes: []
        }));
}

export function getNonAtAttributes(node: RawElementNode, fileName: string): Attribute[] {
    return node.attrs
        .filter(attr => !attr.name.startsWith("@"))
        .map(attr => ({
            name: attr.name,
            value: attr.value,
            pos: getAttrPos(node, attr.name, fileName),
            valueNodes: parseAttrValue(attr.value)
        }));
}

function parseAttrValue(value: string): AttrValueNode[] {
    const regex = /{{(.*?)}}/g;
    const nodes: AttrValueNode[] = [];
    let lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = regex.exec(value)) !== null) {
        if (match.index > lastIndex) {
            nodes.push({
                type: "text",
                value: value.slice(lastIndex, match.index)
            });
        }

        nodes.push({
            type: "expr",
            value: match[1].trim()
        });

        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < value.length) {
        nodes.push({
            type: "text",
            value: value.slice(lastIndex)
        });
    }

    return nodes;
}

function getAttrPos(node: RawElementNode, attrName: string, fileName: string): Pos {
    return {
        fileName: fileName,
        startLine: node.sourceCodeLocation?.attrs?.[attrName].startLine,
        startCol: node.sourceCodeLocation?.attrs?.[attrName].startCol,
        startOffset: node.sourceCodeLocation?.attrs?.[attrName].startOffset,
        endLine: node.sourceCodeLocation?.attrs?.[attrName].endLine,
        endCol: node.sourceCodeLocation?.attrs?.[attrName].endCol,
        endOffset: node.sourceCodeLocation?.attrs?.[attrName].endOffset

    }
}

export function generateCtxId(): string {
    const bytes = new Uint8Array(16);

    crypto.getRandomValues(bytes);

    return Buffer.from(bytes).toString("base64");
}

export function getPos(node: RawChildNode, fileName: string): Pos {
    const pos: Pos = {
        fileName: fileName,
        startLine: node.sourceCodeLocation?.startLine,
        startCol: node.sourceCodeLocation?.startCol,
        startOffset: node.sourceCodeLocation?.startOffset,
        endLine: node.sourceCodeLocation?.endLine,
        endCol: node.sourceCodeLocation?.endCol,
        endOffset: node.sourceCodeLocation?.endOffset
    }

    return pos;
}
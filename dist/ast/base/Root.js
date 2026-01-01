import path from "node:path";
import NodeType from "./node-types.js";
import fs from "fs";
import { parse } from "../../parser/parser.js";
class Root {
    children;
    fileName;
    constructor(children, fileName) {
        this.children = children;
        this.fileName = fileName;
    }
    resolveIncludes(srcPath) {
        this.resolveIncludesRecursive(this.children, srcPath);
    }
    resolveIncludesRecursive(nodes, srcPath) {
        for (const child of nodes) {
            if (child.type === NodeType.Include) {
                const includeNode = child;
                const pos = includeNode.path.pos;
                if (path.basename(includeNode.path.value) === this.fileName) {
                    throw new Error(`Circular include detected: file "${this.fileName}" tries to include itself at ${includeNode.path.value}
                        File: ${pos?.fileName} Line: ${pos?.startLine} Col: ${pos?.startCol}  
                        `);
                }
                const filePath = path.join(srcPath, includeNode.path.value);
                let file = "";
                try {
                    file = fs.readFileSync(filePath, "utf-8");
                }
                catch (err) {
                    throw new Error(`Failed to read file at path "${filePath}". Error: ${err.message} 
                        File: ${pos?.fileName} Line: ${pos?.startLine} Col: ${pos?.startCol}
                        `);
                }
                const parsedRoot = parse(file, filePath);
                parsedRoot.resolveIncludes(srcPath);
                this.resolveIncludesRecursive(includeNode.children, srcPath);
                includeNode.children = [...parsedRoot.children, ...includeNode.children];
            }
            else {
                this.resolveIncludesRecursive(child.getChildren(), srcPath);
            }
        }
    }
    matchSlotsAndContents() {
        const includeNodes = this.collectIncludes(this.children);
        const slots = new Map();
        const contents = new Map();
        for (const iNode of includeNodes) {
            slots.set(iNode.ctxId, new Map());
            contents.set(iNode.ctxId, new Map());
            this.collectSlotsAndContents(iNode.children, iNode.ctxId, slots, contents);
        }
        for (const [k, v] of contents) {
            for (const [innerK, innerV] of v) {
                const slot = slots.get(k)?.get(innerK);
                slot?.children.push(...innerV.children);
            }
        }
        this.unwrapSlotsAndIncludes(this.children);
    }
    collectIncludes(nodes) {
        const includeNodes = [];
        for (const node of nodes) {
            if (node.type === NodeType.Include) {
                includeNodes.push(node);
            }
            includeNodes.push(...this.collectIncludes(node.getChildren()));
        }
        return includeNodes;
    }
    collectSlotsAndContents(nodes, ctxId, slots, contents) {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if (node.type === NodeType.Slot) {
                slots.get(ctxId)?.set(node.name, node);
            }
            else if (node.type === NodeType.Content) {
                contents.get(ctxId)?.set(node.name, node);
                this.collectSlotsAndContents(node.getChildren(), ctxId, slots, contents);
                nodes.splice(i, 1);
                i--;
                continue;
            }
            this.collectSlotsAndContents(node.getChildren(), ctxId, slots, contents);
        }
    }
    unwrapSlotsAndIncludes(nodes) {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const isUnwrap = node.type === NodeType.Include ||
                node.type === NodeType.Slot;
            const children = node.getChildren();
            if (isUnwrap) {
                this.unwrapSlotsAndIncludes(children);
                nodes.splice(i, 1, ...children);
                i += children.length - 1;
            }
            else {
                this.unwrapSlotsAndIncludes(children);
            }
        }
    }
}
export default Root;

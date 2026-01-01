import path from "node:path";
import NodeType from "./node-types.js";
import Node from "./Node.js";
import fs from "fs";
import { ContentNode, IncludeNode, SlotNode } from "../nodes.js";
import { parse } from "../../parser/parser.js";

type slotsMap = Map<string, Map<string, SlotNode>>;
type contentsMap = Map<string, Map<string, ContentNode>>;

class Root {
    public children: Node[];
    public fileName: string;

    constructor(children: Node[], fileName: string) {
        this.children = children;
        this.fileName = fileName;
    }

    public resolveIncludes(srcPath: string) {
        this.resolveIncludesRecursive(this.children, srcPath);
    }

    private resolveIncludesRecursive(nodes: Node[], srcPath: string) {
        for (const child of nodes) {
            if (child.type === NodeType.Include) {
                const includeNode: IncludeNode = child as IncludeNode;
                const pos = includeNode.path.pos;

                if (path.basename(includeNode.path.value) === this.fileName) {
                    throw new Error(
                        `Circular include detected: file "${this.fileName}" tries to include itself at ${includeNode.path.value}
                        File: ${pos?.fileName} Line: ${pos?.startLine} Col: ${pos?.startCol}  
                        `
                    );
                }
                const filePath: string = path.join(srcPath, includeNode.path.value);
                let file: string = "";
                try {
                    file = fs.readFileSync(filePath, "utf-8");
                } catch (err) {
                    throw new Error(
                        `Failed to read file at path "${filePath}". Error: ${(err as Error).message} 
                        File: ${pos?.fileName} Line: ${pos?.startLine} Col: ${pos?.startCol}
                        `
                    );
                }

                const parsedRoot = parse(file, filePath);

                parsedRoot.resolveIncludes(srcPath);
                this.resolveIncludesRecursive(includeNode.children, srcPath);

                includeNode.children = [...parsedRoot.children, ...includeNode.children];
            } else {
                this.resolveIncludesRecursive(child.getChildren(), srcPath);
            }
        }
    }

    public matchSlotsAndContents() {
        const includeNodes = this.collectIncludes(this.children);
        const slots: slotsMap = new Map();
        const contents: contentsMap = new Map();

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

    private collectIncludes(nodes: Node[]): IncludeNode[] {
        const includeNodes: IncludeNode[] = [];

        for (const node of nodes) {
            if (node.type === NodeType.Include) {
                includeNodes.push(node as IncludeNode);
            }

            includeNodes.push(...this.collectIncludes(node.getChildren()));
        }

        return includeNodes;
    }

    private collectSlotsAndContents(nodes: Node[], ctxId: string, slots: slotsMap, contents: contentsMap) {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];

            if (node.type === NodeType.Slot) {
                slots.get(ctxId)?.set((node as SlotNode).name, node as SlotNode);
            } else if (node.type === NodeType.Content) {
                contents.get(ctxId)?.set((node as ContentNode).name, node as ContentNode);
                this.collectSlotsAndContents(node.getChildren(), ctxId, slots, contents);
                nodes.splice(i, 1);
                i--;
                continue;
            }
            this.collectSlotsAndContents(node.getChildren(), ctxId, slots, contents);
        }
    }

    private unwrapSlotsAndIncludes(nodes: Node[]) {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];

            const isUnwrap =
                node.type === NodeType.Include ||
                node.type === NodeType.Slot;

            const children = node.getChildren();

            if (isUnwrap) {
                this.unwrapSlotsAndIncludes(children);

                nodes.splice(i, 1, ...children);

                i += children.length - 1;
            } else {
                this.unwrapSlotsAndIncludes(children);
            }
        }
    }

}

export default Root;
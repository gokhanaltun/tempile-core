import { describe, it, expect } from 'vitest';
import { parseFragment } from 'parse5';
import ContentNode from '../../src/ast/features/ContentNode.js';
import NodeType from '../../src/ast/base/node-types.js';
import Node from '../../src/ast/base/Node.js';
import { RawChildNode } from '../../src/ast/base/parse5-types.js';

// Dummy Node class for parser
class DummyNode extends Node {
    constructor() {
        super(NodeType.Text, undefined);
    }
    getChildren(): Node[] {
        return [];
    }
}

// Dummy parser function
const dummyParser = (nodes: RawChildNode[]): Node[] => nodes.map(() => new DummyNode());

// Helper to parse HTML and get first element
function getFirstElement(html: string): RawChildNode {
    const frag = parseFragment(html, { sourceCodeLocationInfo: true });
    return frag.childNodes[0] as RawChildNode;
}

describe('ContentNode', () => {
    it('creates ContentNode from valid raw node', () => {
        const raw = getFirstElement('<include @path="file.html"><content @name="main">text</content></include>');
        const contentRaw = (raw as any).childNodes[0] as RawChildNode; // <content> node

        const node = ContentNode.newFromRawNode(contentRaw, 'test.html', dummyParser);

        expect(node).not.toBeNull();
        expect(node).toBeInstanceOf(ContentNode);
        if (node instanceof ContentNode) {
            expect(node.type).toBe(NodeType.Content);
            expect(node.name).toBe('main');
            expect(node.children.length).toBe(1); // DummyNode from parser
        }
    });

    it('throws if not an element node', () => {
        const raw: any = { nodeName: '#text' };
        expect(() => ContentNode.newFromRawNode(raw, 'test.html', dummyParser))
            .toThrow(/Expected an element node/);
    });

    it('throws if tag name is not content', () => {
        const raw = getFirstElement('<include @path="file.html"><div></div></include>');
        const nodeRaw = (raw as any).childNodes[0] as RawChildNode;

        expect(() => ContentNode.newFromRawNode(nodeRaw, 'test.html', dummyParser))
            .toThrow(/Expected element tag name 'content'/);
    });

    it('throws if parent is not <include>', () => {
        const raw = getFirstElement('<div><content @name="main"></content></div>');
        const nodeRaw = (raw as any).childNodes[0] as RawChildNode;

        expect(() => ContentNode.newFromRawNode(nodeRaw, 'test.html', dummyParser))
            .toThrow(/can only appear inside an <include>/);
    });

    it('throws if @[name] attribute is missing', () => {
        const raw = getFirstElement('<include @path="file.html"><content></content></include>');
        const nodeRaw = (raw as any).childNodes[0] as RawChildNode;

        expect(() => ContentNode.newFromRawNode(nodeRaw, 'test.html', dummyParser))
            .toThrow(/Missing @\[name\] attribute/);
    });

    it('throws if multiple @ attributes present', () => {
        const raw = getFirstElement('<include @path="file.html"><content @name="x" @extra="y"></content></include>');
        const nodeRaw = (raw as any).childNodes[0] as RawChildNode;

        expect(() => ContentNode.newFromRawNode(nodeRaw, 'test.html', dummyParser))
            .toThrow(/Multiple @ attributes on <content> tag are not allowed/);
    });
});

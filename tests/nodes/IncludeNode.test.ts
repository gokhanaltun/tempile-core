import { describe, it, expect } from 'vitest';
import { parseFragment } from 'parse5';
import IncludeNode from '../../src/ast/features/IncludeNode.js';
import NodeType from '../../src/ast/base/node-types.js';
import Node from '../../src/ast/base/Node.js';
import { RawChildNode } from '../../src/ast/base/parse5-types.js';

class DummyNode extends Node {
    constructor() {
        super(NodeType.Text, undefined);
    }
    getChildren(): Node[] {
        return [];
    }
}

const dummyParser = (nodes: RawChildNode[]): Node[] => nodes.map(() => new DummyNode());

// Helper
function getFirstElement(html: string): RawChildNode {
    const frag = parseFragment(html, { sourceCodeLocationInfo: true });
    return frag.childNodes.find((n) => (n as any).tagName) as RawChildNode;
}

describe('IncludeNode', () => {
    it('creates IncludeNode from valid raw node', () => {
        const raw = getFirstElement('<include @path="file.html">content</include>');
        const node = IncludeNode.newFromRawNode(raw, 'test.html', dummyParser);

        expect(node).not.toBeNull();
        expect(node).toBeInstanceOf(IncludeNode);
        if (node instanceof IncludeNode) {
            expect(node.type).toBe(NodeType.Include);

            expect(node.path).toHaveProperty('name', 'path');
            expect(node.path).toHaveProperty('value', 'file.html');
            expect(node.path).toHaveProperty('pos');

            expect(node.children.length).toBe(1);
            expect(typeof node.ctxId).toBe('string');
        }
    });

    it('throws if not an element node', () => {
        const raw: any = { nodeName: '#text' };
        expect(() => IncludeNode.newFromRawNode(raw, 'test.html', dummyParser))
            .toThrow(/Expected an element node/);
    });

    it('throws if tag name is not include', () => {
        const raw = getFirstElement('<div @path="file.html"></div>');
        expect(() => IncludeNode.newFromRawNode(raw, 'test.html', dummyParser))
            .toThrow(/Expected element tag name 'include'/);
    });

    it('throws if @[path] attribute is missing', () => {
        const raw = getFirstElement('<include></include>');
        expect(() => IncludeNode.newFromRawNode(raw, 'test.html', dummyParser))
            .toThrow(/Missing @\[path\] attribute/);
    });

    it('throws if multiple @ attributes', () => {
        const raw = getFirstElement('<include @path="a" @other="b"></include>');
        expect(() => IncludeNode.newFromRawNode(raw, 'test.html', dummyParser))
            .toThrow(/Multiple @ attributes on <include> tag/);
    });
});

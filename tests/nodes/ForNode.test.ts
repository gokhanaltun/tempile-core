import { describe, it, expect } from 'vitest';
import { parseFragment } from 'parse5';
import ForNode from '../../src/ast/control/ForNode.js';
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

const dummyParser = (nodes: RawChildNode[]): Node[] =>
    nodes.map(() => new DummyNode());

function getFirstElement(html: string): RawChildNode {
    const frag = parseFragment(html, { sourceCodeLocationInfo: true });
    return frag.childNodes.find(
        (n) => (n as any).tagName
    ) as RawChildNode;
}

describe('ForNode', () => {
    it('creates ForNode from valid raw node', () => {
        const rawParent = getFirstElement('<for @lang="item">content</for>');
        const node = ForNode.newFromRawNode(rawParent, 'test.html', dummyParser);

        expect(node).not.toBeNull();
        expect(node).toBeInstanceOf(ForNode);
        if (node instanceof ForNode) {
            expect(node.type).toBe(NodeType.For);
            expect(node.loops.length).toBe(1); // @[lang] attribute
            expect(node.children.length).toBe(1); // DummyNode
        }
    });

    it('returns null if no children', () => {
        const rawParent = getFirstElement('<for @lang="item"></for>');
        const node = ForNode.newFromRawNode(rawParent, 'test.html', dummyParser);

        expect(node).toBeNull();
    });

    it('throws if not an element node', () => {
        const raw: any = { nodeName: '#text' };
        expect(() => ForNode.newFromRawNode(raw, 'test.html', dummyParser))
            .toThrow(/Expected an element node/);
    });

    it('throws if tag name is not for', () => {
        const rawParent = getFirstElement('<div @lang="x"></div>');
        expect(() => ForNode.newFromRawNode(rawParent, 'test.html', dummyParser))
            .toThrow(/Expected element tag name 'for'/);
    });

    it('throws if @[lang] attribute is missing', () => {
        const rawParent = getFirstElement('<for></for>');
        expect(() => ForNode.newFromRawNode(rawParent, 'test.html', dummyParser))
            .toThrow(/Missing @\[lang\] attribute/);
    });
});

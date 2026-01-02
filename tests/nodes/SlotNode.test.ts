import { describe, it, expect } from 'vitest';
import { parseFragment } from 'parse5';
import SlotNode from '../../src/ast/features/SlotNode.js';
import NodeType from '../../src/ast/base/node-types.js';
import Node from '../../src/ast/base/Node.js';
import { RawChildNode } from '../../src/ast/base/parse5-types.js';

// Dummy parser
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
    return frag.childNodes[0] as RawChildNode;
}

describe('SlotNode', () => {
    it('creates SlotNode from valid raw node', () => {
        const raw = getFirstElement('<slot @name="main">content</slot>');
        const node = SlotNode.newFromRawNode(raw, 'test.html', dummyParser);

        expect(node).not.toBeNull();
        expect(node).toBeInstanceOf(SlotNode);
        if (node instanceof SlotNode) {
            expect(node.type).toBe(NodeType.Slot);
            expect(node.name).toBe('main'); // @name attribute değeri
            expect(node.children.length).toBe(1); // DummyNode
        }
    });

    it('throws if not an element node', () => {
        const raw: any = { nodeName: '#text' };
        expect(() => SlotNode.newFromRawNode(raw, 'test.html', dummyParser))
            .toThrow(/Expected an element node/);
    });

    it('throws if tag name is not slot', () => {
        const raw = getFirstElement('<div @name="x"></div>');
        expect(() => SlotNode.newFromRawNode(raw, 'test.html', dummyParser))
            .toThrow(/Expected element tag name 'slot'/);
    });

    it('throws if @[name] attribute is missing', () => {
        const raw = getFirstElement('<slot></slot>');
        expect(() => SlotNode.newFromRawNode(raw, 'test.html', dummyParser))
            .toThrow(/Missing @\[name\] attribute/);
    });

    it('throws if multiple @ attributes present', () => {
        const raw = getFirstElement('<slot @name="a" @lang="b"></slot>');
        expect(() => SlotNode.newFromRawNode(raw, 'test.html', dummyParser))
            .toThrow(/Multiple @ attributes on <slot> tag are not allowed/);
    });
});

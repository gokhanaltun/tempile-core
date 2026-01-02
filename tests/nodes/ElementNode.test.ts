import { describe, it, expect } from 'vitest';
import { parseFragment } from 'parse5';
import ElementNode from '../../src/ast/html/ElementNode.js';
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

describe('ElementNode', () => {
    it('creates ElementNode from raw node', () => {
        const raw = getFirstElement('<div id="main" class="test">text</div>');

        const node = ElementNode.newFromRawNode(raw, 'test.html', dummyParser);

        expect(node).toBeInstanceOf(ElementNode);
        if (node instanceof ElementNode) {
            expect(node.type).toBe(NodeType.Element);
            expect(node.tag).toBe('div');
            expect(node.attrs.length).toBe(2); // id and class
            expect(node.children.length).toBe(1); // DummyNode
        }
    });

    it('throws if not an element node', () => {
        const raw: any = { nodeName: '#text' };

        expect(() => ElementNode.newFromRawNode(raw, 'test.html', dummyParser))
            .toThrow(/Expected an element node/);
    });
});

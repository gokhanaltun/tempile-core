import { describe, it, expect } from 'vitest';
import { parseFragment } from 'parse5';
import ElseNode from '../../src/ast/control/ElseNode.js';
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

// Helper: parse ve ilk element node’u al
function getFirstElement(html: string): RawChildNode {
    const frag = parseFragment(html, { sourceCodeLocationInfo: true });
    return frag.childNodes.find(
        (n) => (n as any).tagName
    ) as RawChildNode;
}

describe('ElseNode', () => {
    it('creates ElseNode from valid raw node', () => {
        const rawIf = getFirstElement('<if @lang="x"><else>text</else></if>');
        const elseRaw = (rawIf as any).childNodes[0] as RawChildNode;

        const node = ElseNode.newFromRawNode(elseRaw, 'test.html', dummyParser);

        expect(node).not.toBeNull();
        expect(node).toBeInstanceOf(ElseNode);
        if (node instanceof ElseNode) {
            expect(node.type).toBe(NodeType.Else);
            expect(node.children.length).toBe(1); // DummyNode
        }
    });

    it('returns null if no children', () => {
        const rawIf = getFirstElement('<if @lang="x"><else></else></if>');
        const elseRaw = (rawIf as any).childNodes[0] as RawChildNode;

        const node = ElseNode.newFromRawNode(elseRaw, 'test.html', dummyParser);
        expect(node).toBeNull();
    });

    it('throws if not an element node', () => {
        const raw: any = { nodeName: '#text' };
        expect(() => ElseNode.newFromRawNode(raw, 'test.html', dummyParser))
            .toThrow(/Expected an element node/);
    });

    it('throws if tag name is not else', () => {
        const rawIf = getFirstElement('<if @lang="x"><elseif></elseif></if>');
        const nodeRaw = (rawIf as any).childNodes[0] as RawChildNode;

        expect(() => ElseNode.newFromRawNode(nodeRaw, 'test.html', dummyParser))
            .toThrow(/Expected element tag name 'else'/);
    });

    it('throws if parent is not <if>', () => {
        const rawDiv = getFirstElement('<div><else></else></div>');
        const nodeRaw = (rawDiv as any).childNodes[0] as RawChildNode;

        expect(() => ElseNode.newFromRawNode(nodeRaw, 'test.html', dummyParser))
            .toThrow(/<else> must be a child of <if>/);
    });
});

import { describe, it, expect } from 'vitest';
import { parseFragment } from 'parse5';
import ElseIfNode from '../../src/ast/control/ElseIfNode.js';
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

// Helper: parse ve ilk elementi al
function getFirstElement(html: string): RawChildNode {
    const frag = parseFragment(html, { sourceCodeLocationInfo: true });
    const element = frag.childNodes.find(
        (n) => (n as any).tagName
    ) as RawChildNode;
    return element;
}

describe('ElseIfNode', () => {
    it('creates ElseIfNode from valid raw node', () => {
        const rawIf = getFirstElement('<if @lang="x"><elseif @lang="y">text</elseif></if>');
        // rawIf childNodes içinden elseif node’u alıyoruz
        const elseifRaw = (rawIf as any).childNodes[0] as RawChildNode;

        const node = ElseIfNode.newFromRawNode(elseifRaw, 'test.html', dummyParser);

        expect(node).not.toBeNull();
        expect(node).toBeInstanceOf(ElseIfNode);
        if (node instanceof ElseIfNode) {
            expect(node.type).toBe(NodeType.ElseIf);
            expect(node.conditions.length).toBe(1);
            expect(node.children.length).toBe(1); // DummyNode
        }
    });

    it('returns null if no children', () => {
        const rawIf = getFirstElement('<if @lang="x"><elseif @lang="y"></elseif></if>');
        const elseifRaw = (rawIf as any).childNodes[0] as RawChildNode;

        const node = ElseIfNode.newFromRawNode(elseifRaw, 'test.html', dummyParser);
        expect(node).toBeNull();
    });

    it('throws if not an element node', () => {
        const raw: any = { nodeName: '#text' };
        expect(() => ElseIfNode.newFromRawNode(raw, 'test.html', dummyParser))
            .toThrow(/Expected an element node/);
    });

    it('throws if tag name is not elseif', () => {
        const rawIf = getFirstElement('<if @lang="x"><else @lang="y"></else></if>');
        const elseRaw = (rawIf as any).childNodes[0] as RawChildNode;

        expect(() => ElseIfNode.newFromRawNode(elseRaw, 'test.html', dummyParser))
            .toThrow(/Expected element tag name 'elseif'/);
    });

    it('throws if parent is not <if>', () => {
        const rawDiv = getFirstElement('<div><elseif @lang="y"></elseif></div>');
        const elseifRaw = (rawDiv as any).childNodes[0] as RawChildNode;

        expect(() => ElseIfNode.newFromRawNode(elseifRaw, 'test.html', dummyParser))
            .toThrow(/<elseif> must be a child of <if>/);
    });

    it('throws if @[lang] attribute is missing', () => {
        const rawIf = getFirstElement('<if @lang="x"><elseif></elseif></if>');
        const elseifRaw = (rawIf as any).childNodes[0] as RawChildNode;

        expect(() => ElseIfNode.newFromRawNode(elseifRaw, 'test.html', dummyParser))
            .toThrow(/Missing @\[lang\] attribute/);
    });
});

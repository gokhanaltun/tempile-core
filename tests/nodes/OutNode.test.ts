import { describe, it, expect } from 'vitest';
import { parseFragment } from 'parse5';
import OutNode from '../../src/ast/features/OutNode.js';
import NodeType from '../../src/ast/base/node-types.js';
import Node from '../../src/ast/base/Node.js';
import { RawChildNode } from '../../src/ast/base/parse5-types.js';

// Helper to parse HTML and get first element
function getFirstElement(html: string): RawChildNode {
    const frag = parseFragment(html, { sourceCodeLocationInfo: true });
    return frag.childNodes[0] as RawChildNode;
}

describe('OutNode', () => {
    it('creates OutNode from valid raw node', () => {
        const raw = getFirstElement('<out>hello world</out>');

        const node = OutNode.newFromRawNode(raw, 'test.html');

        expect(node).not.toBeNull();
        expect(node).toBeInstanceOf(OutNode);
        if (node instanceof OutNode) {
            expect(node.type).toBe(NodeType.Out);
            expect(node.data).toBe('hello world');
            expect(node.isRaw).toBe(false);
            expect(node.getChildren().length).toBe(0);
        }
    });

    it('creates OutNode with raw attribute', () => {
        const raw = getFirstElement('<out @raw>some raw content</out>');

        const node = OutNode.newFromRawNode(raw, 'test.html');

        expect(node).not.toBeNull();
        if (node instanceof OutNode) {
            expect(node.isRaw).toBe(true);
            expect(node.data).toBe('some raw content');
        }
    });

    it('returns null if <out> has no children', () => {
        const raw = getFirstElement('<out></out>');

        const node = OutNode.newFromRawNode(raw, 'test.html');

        expect(node).toBeNull();
    });

    it('throws if not an element node', () => {
        const raw: any = { nodeName: '#text' };
        expect(() => OutNode.newFromRawNode(raw, 'test.html'))
            .toThrow(/Expected an element node/);
    });

    it('throws if tag name is not out', () => {
        const raw = getFirstElement('<div>text</div>');

        expect(() => OutNode.newFromRawNode(raw, 'test.html'))
            .toThrow(/Expected element tag name 'content' but found 'div'/);
    });

    it('throws if multiple @ attributes present', () => {
        const raw = getFirstElement('<out @raw @extra>text</out>');

        expect(() => OutNode.newFromRawNode(raw, 'test.html'))
            .toThrow(/Multiple @ attributes on <out> tag are not allowed/);
    });

    it('throws if child is not text', () => {
        const raw = getFirstElement('<out><div></div></out>');

        expect(() => OutNode.newFromRawNode(raw, 'test.html'))
            .toThrow(/Invalid child node inside <out>/);
    });
});

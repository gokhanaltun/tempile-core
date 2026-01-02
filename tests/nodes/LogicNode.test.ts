import { describe, it, expect } from 'vitest';
import { parseFragment } from 'parse5';
import LogicNode from '../../src/ast/features/LogicNode.js';
import NodeType from '../../src/ast/base/node-types.js';
import Node from '../../src/ast/base/Node.js';
import { RawChildNode } from '../../src/ast/base/parse5-types.js';

// Helper to parse HTML and get first element
function getFirstElement(html: string): RawChildNode {
    const frag = parseFragment(html, { sourceCodeLocationInfo: true });
    return frag.childNodes[0] as RawChildNode;
}

describe('LogicNode', () => {
    it('creates LogicNode from valid raw node', () => {
        const raw = getFirstElement('<logic @js>console.log("hi")</logic>');

        const node = LogicNode.newFromRawNode(raw, 'test.html');

        expect(node).not.toBeNull();
        expect(node).toBeInstanceOf(LogicNode);
        if (node instanceof LogicNode) {
            expect(node.type).toBe(NodeType.Logic);
            expect(node.lang).toBe('js');
            expect(node.data).toBe('console.log("hi")');
            expect(node.getChildren().length).toBe(0);
        }
    });

    it('returns null if <logic> has no children', () => {
        const raw = getFirstElement('<logic @js></logic>');

        const node = LogicNode.newFromRawNode(raw, 'test.html');

        expect(node).toBeNull();
    });

    it('throws if not an element node', () => {
        const raw: any = { nodeName: '#text' };
        expect(() => LogicNode.newFromRawNode(raw, 'test.html'))
            .toThrow(/Expected an element node/);
    });

    it('throws if tag name is not logic', () => {
        const raw = getFirstElement('<div>console.log("hi")</div>');

        expect(() => LogicNode.newFromRawNode(raw, 'test.html'))
            .toThrow(/Expected element tag name 'logic'/);
    });

    it('throws if @[lang] attribute is missing', () => {
        const raw = getFirstElement('<logic>console.log("hi")</logic>');

        expect(() => LogicNode.newFromRawNode(raw, 'test.html'))
            .toThrow(/Missing @\[lang\] attribute/);
    });

    it('throws if multiple @ attributes present', () => {
        const raw = getFirstElement('<logic @js @extra>console.log("hi")</logic>');

        expect(() => LogicNode.newFromRawNode(raw, 'test.html'))
            .toThrow(/Multiple @ attributes on <logic> tag are not allowed/);
    });

    it('throws if child node is not text', () => {
        const raw = getFirstElement('<logic @js><div></div></logic>');

        expect(() => LogicNode.newFromRawNode(raw, 'test.html'))
            .toThrow(/Invalid child node inside <logic>/);
    });
});

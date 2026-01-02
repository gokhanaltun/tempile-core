import { describe, it, expect } from 'vitest';
import { parseFragment } from 'parse5';
import TextNode from '../../src/ast/html/TextNode.js';
import NodeType from '../../src/ast/base/node-types.js';
import type { RawChildNode } from '../../src/ast/base/parse5-types.js';

function createRawTextNode(content: string): RawChildNode {
    return parseFragment(content, { sourceCodeLocationInfo: true }).childNodes[0] as RawChildNode;
}

describe('TextNode', () => {
    it('should create a TextNode from raw text node', () => {
        const rawNode = createRawTextNode('Hello World');
        const node = TextNode.newFromRawNode(rawNode, 'test.html');

        expect(node).toBeInstanceOf(TextNode);
        expect(node.type).toBe(NodeType.Text);
        expect(node.getChildren()).toEqual([]);
        expect((node as TextNode).data).toBe('Hello World');
        expect((node as TextNode).pos).toBeDefined();
        expect((node as TextNode).pos?.fileName).toBe('test.html');
    });

    it('should throw error if raw node is not a text node', () => {
        const rawNode = parseFragment('<div>Not Text</div>', { sourceCodeLocationInfo: true }).childNodes[0] as RawChildNode;

        expect(() => TextNode.newFromRawNode(rawNode, 'test.html')).toThrow(
            /Expected an text node but found 'div'/
        );
    });
});

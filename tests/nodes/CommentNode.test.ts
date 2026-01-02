import { describe, it, expect } from 'vitest';
import { parseFragment } from 'parse5';
import CommentNode from '../../src/ast/html/CommentNode.js';
import NodeType from '../../src/ast/base/node-types.js';
import type { RawChildNode } from '../../src/ast/base/parse5-types.js';

function createRawCommentNode(content: string): RawChildNode {
    const fragment = parseFragment(`<!--${content}-->`, { sourceCodeLocationInfo: true });
    return fragment.childNodes[0] as RawChildNode;
}

describe('CommentNode', () => {
    it('should create a CommentNode from raw comment node', () => {
        const rawNode = createRawCommentNode('This is a comment');
        const node = CommentNode.newFromRawNode(rawNode, 'test.html');

        expect(node).toBeInstanceOf(CommentNode);
        expect(node.type).toBe(NodeType.Comment);
        expect(node.getChildren()).toEqual([]);
        expect((node as CommentNode).data).toBe('This is a comment');
        expect((node as CommentNode).pos).toBeDefined();
        expect((node as CommentNode).pos?.fileName).toBe('test.html');
    });

    it('should throw error if raw node is not a comment node', () => {
        const rawNode = parseFragment('<div>Not a comment</div>', { sourceCodeLocationInfo: true }).childNodes[0] as RawChildNode;

        expect(() => CommentNode.newFromRawNode(rawNode, 'test.html')).toThrow(
            /Expected an comment node but found 'div'/
        );
    });
});

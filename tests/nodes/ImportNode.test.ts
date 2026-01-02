import { describe, it, expect } from 'vitest';
import { parseFragment } from 'parse5';
import ImportNode from '../../src/ast/features/ImportNode.js';
import TextNode from '../../src/ast/html/TextNode.js';
import CommentNode from '../../src/ast/html/CommentNode.js';
import NodeType from '../../src/ast/base/node-types.js';
import type { RawChildNode, RawElementNode } from '../../src/ast/base/parse5-types.js';

// helper: raw import node
function createRawImportNode(content: string): RawChildNode {
    return parseFragment(content, { sourceCodeLocationInfo: true }).childNodes[0] as RawChildNode;
}

// helper: simple rawAstParserFn
const dummyParser = (nodes: RawChildNode[]) => {
    return nodes.map(n => {
        if (n.nodeName === '#text') return TextNode.newFromRawNode(n, 'test.html');
        if (n.nodeName === '#comment') return CommentNode.newFromRawNode(n, 'test.html');
        return null;
    }).filter(Boolean) as (TextNode | CommentNode)[];
};

describe('ImportNode', () => {
    it('should create ImportNode with text child', () => {
        const rawNode = createRawImportNode('<import @js>console.log("hi");</import>');
        const node = ImportNode.newFromRawNode(rawNode, 'test.html', dummyParser);

        expect(node).toBeInstanceOf(ImportNode);
        expect(node.type).toBe(NodeType.Import);
        expect((node as ImportNode).lang).toBe('js');
        expect(node.getChildren().length).toBe(1);
        expect(node.getChildren()[0]).toBeInstanceOf(TextNode);
        expect((node as ImportNode).pos?.fileName).toBe('test.html');
    });

    it('should create ImportNode with comment child', () => {
        const rawNode = createRawImportNode('<import @go><!-- comment --></import>');
        const node = ImportNode.newFromRawNode(rawNode, 'test.html', dummyParser);

        expect(node.getChildren().length).toBe(1);
        expect(node.getChildren()[0]).toBeInstanceOf(CommentNode);
        expect((node as ImportNode).lang).toBe('go');
    });

    it('should allow empty child nodes', () => {
        const rawNode = createRawImportNode('<import @js></import>');
        const node = ImportNode.newFromRawNode(rawNode, 'test.html', dummyParser);

        expect(node.getChildren().length).toBe(0);
        expect((node as ImportNode).lang).toBe('js');
    });

    it('should throw if @[lang] attribute is missing', () => {
        const rawNode = createRawImportNode('<import></import>');

        expect(() => ImportNode.newFromRawNode(rawNode, 'test.html', dummyParser))
            .toThrow(/Missing @\[lang\] attribute/);
    });

    it('should throw if multiple @ attributes are present', () => {
        const rawNode = createRawImportNode('<import @js @go></import>');

        expect(() => ImportNode.newFromRawNode(rawNode, 'test.html', dummyParser))
            .toThrow(/Multiple @ attributes/);
    });

    it('should throw if parent node is not document fragment', () => {
        const fragment = parseFragment('<div><import @js></import></div>', { sourceCodeLocationInfo: true });
        const parentDiv = fragment.childNodes[0] as RawElementNode;
        const rawNode = parentDiv.childNodes[0] as RawElementNode;

        expect(() => ImportNode.newFromRawNode(rawNode, 'test.html', dummyParser))
            .toThrow(/<import> node cannot be a child of another element/);
    });

    it('should throw if child node is invalid', () => {
        const rawNode = createRawImportNode('<import @js><div></div></import>');

        expect(() => ImportNode.newFromRawNode(rawNode, 'test.html', dummyParser))
            .toThrow(/Invalid child node inside <import>/);
    });
});

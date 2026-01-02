import { describe, it, expect } from 'vitest';
import { parseFragment } from 'parse5';

import IfNode from '../../src/ast/control/IfNode.js';
import ElseIfNode from '../../src/ast/control/ElseIfNode.js';
import ElseNode from '../../src/ast/control/ElseNode.js';
import NodeType from '../../src/ast/base/node-types.js';
import type { RawChildNode, RawElementNode } from '../../src/ast/base/parse5-types.js';

const dummyParser = (nodes: RawChildNode[], fileName: string) => {
    return nodes.map(n => {
        if ((n as RawElementNode).tagName === 'elseif') return new ElseIfNode([], [], {} as any);
        if ((n as RawElementNode).tagName === 'else') return new ElseNode([], {} as any);
        return { type: 'dummy', pos: {} } as any;
    });
};

const getFirstElement = (html: string) =>
    parseFragment(html, { sourceCodeLocationInfo: true })
        .childNodes[0] as RawElementNode;

describe('IfNode', () => {
    it('throws if not an element', () => {
        const fragment = parseFragment('Text', { sourceCodeLocationInfo: true });
        const raw = fragment.childNodes[0] as RawChildNode;

        expect(() => IfNode.newFromRawNode(raw, 'test.html', dummyParser))
            .toThrow(/Expected an element node/);
    });

    it('throws if tag is not if', () => {
        const raw = getFirstElement('<div @lang="en"></div>');

        expect(() => IfNode.newFromRawNode(raw, 'test.html', dummyParser))
            .toThrow(/Expected element tag name 'if'/);
    });

    it('throws if @ attribute missing', () => {
        const raw = getFirstElement('<if></if>');

        expect(() => IfNode.newFromRawNode(raw, 'test.html', dummyParser))
            .toThrow(/Missing @\[lang] attribute/);
    });

    it('returns null if no ifContent children', () => {
        const raw = getFirstElement('<if @lang="en"></if>');

        const node = IfNode.newFromRawNode(raw, 'test.html', () => []);
        expect(node).toBeNull();
    });

    it('parses children into ifContent, elseIfNodes, elseNode', () => {
        const raw = getFirstElement('<if @lang="en"><p>hi</p><elseif @lang="x"></elseif><else></else></if>');

        const node = IfNode.newFromRawNode(raw, 'test.html', dummyParser)!;

        expect(node).not.toBeNull();
        if (node instanceof IfNode) {
            expect(node.type).toBe(NodeType.If);
            expect(node.ifContent.length).toBe(1); // <p>hi</p>
            expect(node.elseIfNodes.length).toBe(1);
            expect(node.elseNode).toBeInstanceOf(ElseNode);
        } else {
            throw new Error('Expected IfNode');
        }
    });

    it('throws if multiple <else> blocks', () => {
        const raw = getFirstElement('<if @lang="en"><else></else><else></else></if>');

        expect(() => IfNode.newFromRawNode(raw, 'test.html', dummyParser))
            .toThrow(/Multiple <else> blocks are not allowed/);
    });
});

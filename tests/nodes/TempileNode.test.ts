import { describe, it, expect } from 'vitest';
import { parseFragment } from 'parse5';

import TempileNode from '../../src/ast/features/TempileNode.js';
import NodeType from '../../src/ast/base/node-types.js';
import { ElementNode } from '../../src/ast/nodes.js';
import DoctypeNode from '../../src/ast/html/DoctypeNode.js';

import type { RawChildNode, RawElementNode } from '../../src/ast/base/parse5-types.js';

const dummyParser = (nodes: RawChildNode[]) => [];

// helper
const getFirstElement = (html: string) =>
    parseFragment(html, { sourceCodeLocationInfo: true })
        .childNodes[0] as RawElementNode;

describe('TempileNode', () => {
    it('throws if not element node', () => {
        const fragment = parseFragment('Text', { sourceCodeLocationInfo: true });
        const raw = fragment.childNodes[0] as RawChildNode;

        expect(() => TempileNode.newFromRawNode(raw, 'test.html', dummyParser))
            .toThrow(/Expected an element node/);
    });

    it('throws if tag name is not tempile', () => {
        const raw = getFirstElement('<div @html></div>');

        expect(() => TempileNode.newFromRawNode(raw, 'test.html', dummyParser))
            .toThrow(/Expected element tag name 'tempile'/);
    });

    it('throws if @ attribute missing', () => {
        const raw = getFirstElement('<tempile></tempile>');

        expect(() => TempileNode.newFromRawNode(raw, 'test.html', dummyParser))
            .toThrow(/Missing @\[type] attribute/);
    });

    it('throws if multiple @ attributes', () => {
        const raw = getFirstElement('<tempile @html @head></tempile>');

        expect(() => TempileNode.newFromRawNode(raw, 'test.html', dummyParser))
            .toThrow(/Multiple @ attributes/);
    });

    it('throws on invalid @ value', () => {
        const raw = getFirstElement('<tempile @invalid></tempile>');

        expect(() => TempileNode.newFromRawNode(raw, 'test.html', dummyParser))
            .toThrow(/Invalid @ attribute/);
    });

    it('returns DoctypeNode when @doctype', () => {
        const raw = getFirstElement('<tempile @doctype></tempile>');

        const node = TempileNode.newFromRawNode(raw, 'test.html', dummyParser);

        expect(node).toBeInstanceOf(DoctypeNode);
        expect(node.type).toBe(NodeType.Doctype);
    });

    it('returns ElementNode for valid @html and parses children + attrs', () => {
        const raw = getFirstElement(
            `<tempile @html lang="en"><p>Hello</p></tempile>`
        );

        const fakeChildren = [{} as any];
        const parser = () => fakeChildren;

        const node = TempileNode.newFromRawNode(raw, 'test.html', parser) as ElementNode;

        expect(node).toBeInstanceOf(ElementNode);
        expect(node.tag).toBe('html');
        expect(node.attrs.some(a => a.name === 'lang')).toBe(true);
        expect(node.children).toBe(fakeChildren);
    });
});

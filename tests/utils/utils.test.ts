import { describe, it, expect } from 'vitest';
import { parseFragment } from 'parse5';

import {
    getAtAttributes,
    getNonAtAttributes,
    generateCtxId,
    getPos
} from '../../src/utils/utils.js';

import { RawElementNode, RawChildNode } from '../../src/ast/base/parse5-types.js';

function getFirstElement(html: string): RawElementNode {
    const frag = parseFragment(html, { sourceCodeLocationInfo: true });
    return frag.childNodes[0] as RawElementNode;
}

describe('utils', () => {

    // ------------------------------
    // getAtAttributes
    // ------------------------------
    it('extracts @ attributes correctly', () => {
        const el = getFirstElement('<div @foo="bar" class="x" @lang="ts"></div>');

        const attrs = getAtAttributes(el, 'test.html');

        expect(attrs.map(a => a.name)).toEqual(['foo', 'lang']);
        expect(attrs.map(a => a.value)).toEqual(['bar', 'ts']);

        // pos objesi var mı?
        expect(attrs[0].pos.fileName).toBe('test.html');
    });

    // ------------------------------
    // getNonAtAttributes + parseAttrValue
    // ------------------------------
    it('extracts non-@ attributes and parses expressions inside values', () => {
        const el = getFirstElement(
            `<div id="main" title="hello {{ user.name }} world"></div>`
        );

        const attrs = getNonAtAttributes(el, 'test.html');

        expect(attrs.map(a => a.name)).toEqual(['id', 'title']);

        const title = attrs[1];

        expect(title.valueNodes).toEqual([
            { type: 'text', value: 'hello ' },
            { type: 'expr', value: 'user.name' },
            { type: 'text', value: ' world' }
        ]);
    });

    // ------------------------------
    // getPos
    // ------------------------------
    it('returns position info for a node', () => {
        const raw = parseFragment('<p>hi</p>', { sourceCodeLocationInfo: true })
            .childNodes[0] as RawChildNode;

        const pos = getPos(raw, 'page.html');

        expect(pos.fileName).toBe('page.html');
        expect(pos.startLine).toBe(1);
        expect(pos.endLine).toBe(1);
    });

    // ------------------------------
    // generateCtxId
    // ------------------------------
    it('generates unique base64 ids', () => {
        const a = generateCtxId();
        const b = generateCtxId();

        expect(typeof a).toBe('string');
        expect(a.length).toBeGreaterThan(10);
        expect(a).not.toBe(b);               
    });
});

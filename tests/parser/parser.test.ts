import { describe, it, expect } from "vitest";
import { parse } from "../../src/parser/parser.js";
import Root from "../../src/ast/base/Root.js";
import NodeType from "../../src/ast/base/node-types.js";
import { ElementNode, TextNode } from "../../src/ast/nodes.js";

describe("parser", () => {
    it("should parse html fragment as Root", () => {
        const root = parse(`<div>Hello</div>`, "test.html");

        expect(root).toBeInstanceOf(Root);
        expect(root.children.length).toBe(1);
    });

    it("should correctly parse text node", () => {
        const root = parse(`Hello`, "test.html");

        const node = root.children[0];

        expect(node.type).toBe(NodeType.Text);
        expect((node as TextNode).data).toBe("Hello");
    });

    it("should correctly parse element node", () => {
        const root = parse(`<div>ok</div>`, "test.html");

        const node = root.children[0];

        expect(node.type).toBe(NodeType.Element);
        expect((node as ElementNode).tag).toBe("div");
    });
});

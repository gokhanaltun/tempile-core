import { describe, it, expect, vi } from "vitest";
import { parse } from "../../src/parser/parser.js";
import fs from "fs";
import { ElementNode } from "../../src/ast/nodes.js";

vi.mock("fs");

describe("Root.resolveIncludes", () => {

    it("should inline included file", () => {
        (fs.readFileSync as any).mockReturnValue(`<div>included</div>`);

        const root = parse(`<include @path="header.html"></include>`, "main.html");

        root.resolveIncludes("./");

        const includeNode = root.children[0] as any;
        expect(includeNode.children.some((c: any) => c.tag === "div")).toBe(true);
    });

    it("should throw when file cannot be found", () => {
        (fs.readFileSync as any).mockImplementation(() => {
            throw new Error("ENOENT");
        });

        const root = parse(`<include @path="missing.html"></include>`, "main.html");

        expect(() => root.resolveIncludes("/src")).toThrow();
    });

    it("should detect circular include", () => {
        (fs.readFileSync as any).mockReturnValue(
            `<include @path="main.html"></include>`
        );

        const root = parse(`<include @path="main.html"></include>`, "main.html");

        expect(() => root.resolveIncludes("/src")).toThrow(
            /Circular include/
        );
    });
});

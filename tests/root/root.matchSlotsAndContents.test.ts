import { describe, it, expect, vi } from "vitest";
import { parse } from "../../src/parser/parser.js";
import fs from "fs";
import { ElementNode } from "../../src/ast/nodes.js";

vi.mock("fs");

describe("Root.matchSlotsAndContents", () => {

    it("should move content children into matching slots and unwrap structure", () => {
        // index2.html mock
        (fs.readFileSync as any).mockReturnValue(`
        <div>
            <slot @name="header"></slot>
        </div>
        `);

        const root = parse(`
        <include @path="layout.html">
            <content @name="header">
                <p>Index2 Page</p>
            </content>
        </include>
        `, "main.html");

        root.resolveIncludes("./");
        root.matchSlotsAndContents();

        function findAllTags(nodes: any[]): string[] {
            let tags: string[] = [];
            for (const node of nodes) {
                if (node instanceof ElementNode) {
                    tags.push(node.tag);
                    tags.push(...findAllTags(node.getChildren()));
                }
            }
            return tags;
        }

        const allTags = findAllTags(root.children);

        console.log("All tags in AST:", allTags);

        expect(allTags).toContain("p");
    });
});

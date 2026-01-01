import Node from "../ast/base/Node.js";
import type { RawChildNode } from "../ast/base/parse5-types.js";
import Root from "../ast/base/Root.js";
declare function parse(source: string, fileName: string): Root;
declare function parseRawAST(raw: RawChildNode[], fileName: string): Node[];
export { parse, parseRawAST };

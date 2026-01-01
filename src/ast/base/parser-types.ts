import Node from "./Node.js";
import { RawChildNode } from "./parse5-types.js";

export type RawASTParserFunction = (raw: RawChildNode[], fileName: string) => Node[];
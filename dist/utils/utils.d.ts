import { RawChildNode, RawElementNode } from "../ast/base/parse5-types.js";
import Pos from "../ast/base/Pos.js";
import { Attribute } from "../ast/html/Attribute.js";
export declare function getAtAttributes(node: RawElementNode, fileName: string): Attribute[];
export declare function getNonAtAttributes(node: RawElementNode, fileName: string): Attribute[];
export declare function generateCtxId(): string;
export declare function getPos(node: RawChildNode, fileName: string): Pos;

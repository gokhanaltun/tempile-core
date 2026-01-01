import Node from "./Node.js";
declare class Root {
    children: Node[];
    fileName: string;
    constructor(children: Node[], fileName: string);
    resolveIncludes(srcPath: string): void;
    private resolveIncludesRecursive;
    matchSlotsAndContents(): void;
    private collectIncludes;
    private collectSlotsAndContents;
    private unwrapSlotsAndIncludes;
}
export default Root;

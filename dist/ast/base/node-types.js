var NodeType;
(function (NodeType) {
    NodeType["Import"] = "import";
    NodeType["Doctype"] = "doctype";
    NodeType["Tempile"] = "tempile";
    NodeType["Comment"] = "comment";
    NodeType["Text"] = "text";
    NodeType["Element"] = "element";
    NodeType["If"] = "if";
    NodeType["ElseIf"] = "elseif";
    NodeType["Else"] = "else";
    NodeType["For"] = "for";
    NodeType["Include"] = "include";
    NodeType["Slot"] = "slot";
    NodeType["Content"] = "content";
    NodeType["Out"] = "out";
    NodeType["Logic"] = "logic";
})(NodeType || (NodeType = {}));
export default NodeType;

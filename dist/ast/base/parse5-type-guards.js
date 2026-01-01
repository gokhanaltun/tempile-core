export function isRawTextNode(node) {
    return node.nodeName === "#text";
}
export function isRawCommentNode(node) {
    return node.nodeName === "#comment";
}
export function isRawElementNode(node) {
    return "tagName" in node;
}

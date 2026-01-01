import { parseFragment } from "parse5";
import * as Nodes from "../ast/nodes.js";
import Root from "../ast/base/Root.js";
function parse(source, fileName) {
    const raw = parseFragment(source, { sourceCodeLocationInfo: true });
    const nodes = parseRawAST(raw.childNodes, fileName);
    return new Root(nodes, fileName);
}
function parseRawAST(raw, fileName) {
    const nodes = [];
    for (const node of raw) {
        switch (node.nodeName) {
            case "#text":
                nodes.push(Nodes.TextNode.newFromRawNode(node, fileName));
                break;
            case "#comment":
                nodes.push(Nodes.CommentNode.newFromRawNode(node, fileName));
                break;
            case "import":
                nodes.push(Nodes.ImportNode.newFromRawNode(node, fileName, parseRawAST));
                break;
            case "tempile":
                nodes.push(Nodes.TempileNode.newFromRawNode(node, fileName, parseRawAST));
                break;
            case "if":
                const ifNode = Nodes.IfNode.newFromRawNode(node, fileName, parseRawAST);
                if (ifNode)
                    nodes.push(ifNode);
                break;
            case "elseif":
                const elseIfNode = Nodes.ElseIfNode.newFromRawNode(node, fileName, parseRawAST);
                if (elseIfNode)
                    nodes.push(elseIfNode);
                break;
            case "else":
                const elseNode = Nodes.ElseNode.newFromRawNode(node, fileName, parseRawAST);
                if (elseNode)
                    nodes.push(elseNode);
                break;
            case "for":
                const forNode = Nodes.ForNode.newFromRawNode(node, fileName, parseRawAST);
                if (forNode)
                    nodes.push(forNode);
                break;
            case "include":
                nodes.push(Nodes.IncludeNode.newFromRawNode(node, fileName, parseRawAST));
                break;
            case "slot":
                nodes.push(Nodes.SlotNode.newFromRawNode(node, fileName, parseRawAST));
                break;
            case "content":
                nodes.push(Nodes.ContentNode.newFromRawNode(node, fileName, parseRawAST));
                break;
            case "out":
                const outNode = Nodes.OutNode.newFromRawNode(node, fileName);
                if (outNode)
                    nodes.push(outNode);
                break;
            case "logic":
                const logicNode = Nodes.LogicNode.newFromRawNode(node, fileName);
                if (logicNode)
                    nodes.push(logicNode);
                break;
            default:
                nodes.push(Nodes.ElementNode.newFromRawNode(node, fileName, parseRawAST));
                break;
        }
    }
    return nodes;
}
export { parse, parseRawAST };

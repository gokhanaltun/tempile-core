package tempilecore

import (
	"fmt"
	"regexp"
	"strings"

	"golang.org/x/net/html"
	"golang.org/x/net/html/atom"
)

var (
	reTextNode = regexp.MustCompile(`(?s){{@(\w+)\s+(.*?)}}|{{(.*?)}}`)
)

func Parse(src string) (*Root, error) {
	reader := strings.NewReader(src)
	rawAST, err := html.ParseFragment(reader, &html.Node{Type: html.ElementNode, Data: "body", DataAtom: atom.Body})
	if err != nil {
		return nil, err
	}

	rootNode := &html.Node{
		Type: html.ElementNode,
		Data: "root",
	}

	for _, n := range rawAST {
		rootNode.AppendChild(n)
	}

	return &Root{Childs: parseRawAstToCustomAst(rootNode)}, nil
}

func parseRawAstToCustomAst(rawAST *html.Node) []Node {
	var nodes []Node

	for c := rawAST.FirstChild; c != nil; c = c.NextSibling {
		switch c.Type {
		case html.CommentNode:
			commentNode := parseCommentNode(c)
			if commentNode != nil {
				nodes = append(nodes, commentNode)
			}
		case html.TextNode:
			textNode := parseTextNode(c)
			if textNode != nil {
				nodes = append(nodes, textNode...)
			}
		case html.ElementNode:
			tag := strings.ToLower(c.Data)

			switch tag {
			case "if":
				ifNode := parseIfNode(c)
				if ifNode != nil {
					nodes = append(nodes, ifNode)
				}
			case "elseif":
				elseIfNode := parseElseIfNode(c)
				if elseIfNode != nil {
					nodes = append(nodes, elseIfNode)
				}
			case "else":
				nodes = append(nodes, parseElseNode(c))
			case "for":
				forNode := parseForNode(c)
				if forNode != nil {
					nodes = append(nodes, forNode)
				}
			case "import":
				importNode := parseImportNode(c)

				if importNode != nil {
					nodes = append(nodes, importNode)
				}
			case "slot":
				slotNode := parseSlotNode(c)
				if slotNode != nil {
					nodes = append(nodes, slotNode)
				}
			case "content":
				contentNode := parseContentNode(c)
				if contentNode != nil {
					nodes = append(nodes, contentNode)
				}
			default:
				nodes = append(nodes, parseElementNode(c))
			}
		}
	}
	return nodes
}

func parseCommentNode(node *html.Node) *CommentNode {
	trimmed := strings.TrimSpace(node.Data)
	if trimmed != "" {
		return &CommentNode{Data: fmt.Sprintf("<!-- %s -->", node.Data)}
	}

	return nil
}

func parseTextNode(node *html.Node) []Node {
	trimmed := strings.TrimSpace(node.Data)
	if trimmed == "" {
		return nil
	}

	var nodes []Node
	lastIndex := 0

	for _, m := range reTextNode.FindAllStringSubmatchIndex(trimmed, -1) {
		if m[0] > lastIndex {
			nodes = append(nodes, &TextNode{Data: trimmed[lastIndex:m[0]]})
		}

		if m[2] != -1 {
			lang := trimmed[m[2]:m[3]]
			code := trimmed[m[4]:m[5]]
			if lang == "raw" {
				nodes = append(nodes, &RawExprNode{Expr: code})
			} else {
				nodes = append(nodes, &RawCodeNode{Lang: lang, Code: code})
			}
		} else if m[6] != -1 {
			expr := trimmed[m[6]:m[7]]
			nodes = append(nodes, &ExprNode{Expr: expr})
		}

		lastIndex = m[1]
	}

	if lastIndex < len(trimmed) {
		nodes = append(nodes, &TextNode{Data: trimmed[lastIndex:]})
	}

	return nodes
}

func parseElementNode(node *html.Node) Node {
	tempileType := searchAttr(node.Attr, "type")
	tag := ""
	var attrs []*Attribute

	switch tempileType {
	case "doctype":
		return &DocumentTypeNode{Data: "<!DOCTYPE html>"}
	case "html":
		tag = "html"
		attrs = deleteFromAttrs(node.Attr, "type")
	case "head":
		tag = "head"
		attrs = deleteFromAttrs(node.Attr, "type")
	case "body":
		tag = "body"
		attrs = deleteFromAttrs(node.Attr, "type")
	default:
		tag = strings.ToLower(node.Data)
		attrs = parseAttrs(node.Attr)
	}

	return &ElementNode{
		Tag:    tag,
		Attrs:  attrs,
		Childs: parseRawAstToCustomAst(node),
	}
}

func parseIfNode(node *html.Node) *IfNode {
	conds := parseAttrs(node.Attr)

	if len(conds) > 0 {
		childs := parseRawAstToCustomAst(node)
		ifNode := &IfNode{
			Conds: conds,
		}

		for _, c := range childs {
			switch c.Type() {
			case NodeElseIf:
				elseIfNode := c.(*ElseIfNode)
				ifNode.ElseIfNodes = append(ifNode.ElseIfNodes, elseIfNode)
			case NodeElse:
				elseNode := c.(*ElseNode)
				ifNode.Else = elseNode
			default:
				ifNode.Then = append(ifNode.Then, c)
			}
		}
		return ifNode
	}
	return nil
}

func parseElseIfNode(node *html.Node) *ElseIfNode {
	conds := parseAttrs(node.Attr)

	if len(conds) > 0 {
		return &ElseIfNode{
			Conds:  conds,
			Childs: parseRawAstToCustomAst(node),
		}
	}

	return nil
}

func parseElseNode(node *html.Node) *ElseNode {
	return &ElseNode{Childs: parseRawAstToCustomAst(node)}
}

func parseForNode(node *html.Node) *ForNode {
	loops := parseAttrs(node.Attr)

	if len(loops) > 0 {
		return &ForNode{
			Loops:  loops,
			Childs: parseRawAstToCustomAst(node),
		}
	}

	return nil
}

func parseImportNode(node *html.Node) *ImportNode {
	path := searchAttr(node.Attr, "path")

	if path != "" {
		return &ImportNode{
			Path:   path,
			Childs: parseRawAstToCustomAst(node),
		}
	}

	return nil
}

func parseSlotNode(node *html.Node) *SlotNode {
	name := searchAttr(node.Attr, "name")

	if name != "" {
		return &SlotNode{
			Name:   name,
			Childs: parseRawAstToCustomAst(node),
		}
	}

	return nil
}

func parseContentNode(node *html.Node) *ContentNode {
	name := searchAttr(node.Attr, "name")

	if name != "" {
		return &ContentNode{
			Name:   name,
			Childs: parseRawAstToCustomAst(node),
		}
	}

	return nil
}

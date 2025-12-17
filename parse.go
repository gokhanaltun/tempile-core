package tempilecore

import (
	"errors"
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

	childs, err := parseRawAstToCustomAst(rootNode)
	if err != nil {
		return nil, err
	}

	return &Root{Childs: childs}, nil
}

func parseRawAstToCustomAst(rawAST *html.Node) ([]Node, error) {
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
				ifNode, err := parseIfNode(c)
				if err != nil {
					return nil, err
				}
				nodes = append(nodes, ifNode)
			case "elseif":
				elseIfNode, err := parseElseIfNode(c)
				if err != nil {
					return nil, err
				}
				nodes = append(nodes, elseIfNode)
			case "else":
				childs, err := parseElseNode(c)
				if err != nil {
					return nil, err
				}
				nodes = append(nodes, childs)
			case "for":
				forNode, err := parseForNode(c)
				if err != nil {
					return nil, err
				}
				nodes = append(nodes, forNode)
			case "import":
				importNode, err := parseImportNode(c)

				if err != nil {
					return nil, err
				}
				nodes = append(nodes, importNode)

			case "slot":
				slotNode, err := parseSlotNode(c)
				if err != nil {
					return nil, err
				}
				nodes = append(nodes, slotNode)
			case "content":
				contentNode, err := parseContentNode(c)
				if err != nil {
					return nil, err
				}
				nodes = append(nodes, contentNode)
			default:
				childs, err := parseElementNode(c)
				if err != nil {
					return nil, err
				}
				nodes = append(nodes, childs)
			}
		}
	}
	return nodes, nil
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

func parseElementNode(node *html.Node) (Node, error) {
	tempileType := searchAttr(node.Attr, "type")
	tag := ""
	var attrs []*Attribute

	switch tempileType {
	case "doctype":
		return &DocumentTypeNode{Data: "<!DOCTYPE html>"}, nil
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

	childs, err := parseRawAstToCustomAst(node)
	if err != nil {
		return nil, err
	}

	return &ElementNode{
		Tag:    tag,
		Attrs:  attrs,
		Childs: childs,
	}, nil
}

func parseIfNode(node *html.Node) (*IfNode, error) {
	conds := parseAttrs(node.Attr)

	if len(conds) > 0 {
		childs, err := parseRawAstToCustomAst(node)
		if err != nil {
			return nil, err
		}

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
		return ifNode, nil
	}
	return nil, errors.New("conds is empty")
}

func parseElseIfNode(node *html.Node) (*ElseIfNode, error) {
	conds := parseAttrs(node.Attr)

	if len(conds) > 0 {
		childs, err := parseRawAstToCustomAst(node)
		if err != nil {
			return nil, err
		}
		return &ElseIfNode{
			Conds:  conds,
			Childs: childs,
		}, nil
	}

	return nil, errors.New("conds is empty")
}

func parseElseNode(node *html.Node) (*ElseNode, error) {
	childs, err := parseRawAstToCustomAst(node)
	if err != nil {
		return nil, err
	}

	return &ElseNode{Childs: childs}, nil
}

func parseForNode(node *html.Node) (*ForNode, error) {
	loops := parseAttrs(node.Attr)

	if len(loops) > 0 {
		childs, err := parseRawAstToCustomAst(node)
		if err != nil {
			return nil, err
		}

		return &ForNode{
			Loops:  loops,
			Childs: childs,
		}, nil
	}

	return nil, errors.New("loops is empty")
}

func parseImportNode(node *html.Node) (*ImportNode, error) {
	ctxId, err := generateId()
	if err != nil {
		return nil, err
	}
	path := searchAttr(node.Attr, "path")

	if path != "" {
		childs, err := parseRawAstToCustomAst(node)
		if err != nil {
			return nil, err
		}

		return &ImportNode{
			CtxId:  ctxId,
			Path:   path,
			Childs: childs,
		}, nil
	}

	return nil, errors.New("path is empty")
}

func parseSlotNode(node *html.Node) (*SlotNode, error) {
	name := searchAttr(node.Attr, "name")

	if name != "" {
		childs, err := parseRawAstToCustomAst(node)
		if err != nil {
			return nil, err
		}

		return &SlotNode{
			Name:   name,
			Childs: childs,
		}, nil
	}

	return nil, errors.New("slot name is null")
}

func parseContentNode(node *html.Node) (*ContentNode, error) {
	name := searchAttr(node.Attr, "name")

	if name != "" {
		childs, err := parseRawAstToCustomAst(node)
		if err != nil {
			return nil, err
		}

		return &ContentNode{
			Name:   name,
			Childs: childs,
		}, nil
	}

	return nil, errors.New("content name is null")
}

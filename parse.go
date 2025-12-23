package tempilecore

import (
	"fmt"
	"regexp"
	"strings"

	"golang.org/x/net/html"
	"golang.org/x/net/html/atom"
)

var (
	reTextNode     = regexp.MustCompile(`(?s){{@(\w+)\s+(.*?)}}|{{(.*?)}}`)
	sourceMapIndex = 0
)

func Parse(src string, fileName string) (*Root, error) {
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

	childs, err := parseRawAstToCustomAst(rootNode, src, fileName)
	if err != nil {
		return nil, err
	}

	return &Root{Childs: childs}, nil
}

func parseRawAstToCustomAst(rawAST *html.Node, src string, fileName string) ([]Node, error) {
	var nodes []Node

	for c := rawAST.FirstChild; c != nil; c = c.NextSibling {
		switch c.Type {
		case html.CommentNode:
			commentNode := parseCommentNode(c, src, fileName)
			if commentNode != nil {
				nodes = append(nodes, commentNode)
			}
		case html.TextNode:
			textNode := parseTextNode(c, src, fileName)
			if textNode != nil {
				nodes = append(nodes, textNode...)
			}
		case html.ElementNode:
			tag := strings.ToLower(c.Data)

			switch tag {
			case "if":
				ifNode, err := parseIfNode(c, src, fileName)
				if err != nil {
					return nil, err
				}
				nodes = append(nodes, ifNode)
			case "elseif":
				elseIfNode, err := parseElseIfNode(c, src, fileName)
				if err != nil {
					return nil, err
				}
				nodes = append(nodes, elseIfNode)
			case "else":
				childs, err := parseElseNode(c, src, fileName)
				if err != nil {
					return nil, err
				}
				nodes = append(nodes, childs)
			case "for":
				forNode, err := parseForNode(c, src, fileName)
				if err != nil {
					return nil, err
				}
				nodes = append(nodes, forNode)
			case "import":
				importNode, err := parseIncludeNode(c, src, fileName)

				if err != nil {
					return nil, err
				}
				nodes = append(nodes, importNode)

			case "slot":
				slotNode, err := parseSlotNode(c, src, fileName)
				if err != nil {
					return nil, err
				}
				nodes = append(nodes, slotNode)
			case "content":
				contentNode, err := parseContentNode(c, src, fileName)
				if err != nil {
					return nil, err
				}
				nodes = append(nodes, contentNode)
			default:
				childs, err := parseElementNode(c, src, fileName)
				if err != nil {
					return nil, err
				}
				nodes = append(nodes, childs)
			}
		}
	}
	return nodes, nil
}

func parseCommentNode(node *html.Node, src string, fileName string) *CommentNode {
	trimmed := strings.TrimSpace(node.Data)
	if trimmed != "" {
		line, lastIndex := getExactLine(src, sourceMapIndex, node.Data)
		sourceMapIndex = lastIndex
		return &CommentNode{
			Data: fmt.Sprintf("<!-- %s -->", node.Data),
			Pos: Pos{
				FileName: fileName,
				Line:     line,
			},
		}
	}

	return nil
}

func parseTextNode(node *html.Node, src string, fileName string) []Node {
	if strings.TrimSpace(node.Data) == "" {
		return nil
	}

	var nodes []Node

	_, baseIndex := getExactLine(src, sourceMapIndex, node.Data)

	sourceMapIndex = baseIndex + len(node.Data)

	lastInternalIndex := 0
	trimmedData := node.Data

	for _, m := range reTextNode.FindAllStringSubmatchIndex(trimmedData, -1) {
		if m[0] > lastInternalIndex {
			subText := trimmedData[lastInternalIndex:m[0]]
			l := getLine(src, baseIndex+lastInternalIndex)

			nodes = append(nodes, &TextNode{
				Data: subText,
				Pos: Pos{
					FileName: fileName,
					Line:     l,
				},
			})
		}

		if m[2] != -1 {
			lang := trimmedData[m[2]:m[3]]
			code := trimmedData[m[4]:m[5]]
			l := getLine(src, baseIndex+m[0])

			if lang == "raw" {
				nodes = append(nodes, &RawExprNode{
					Expr: code,
					Pos: Pos{
						FileName: fileName,
						Line:     l,
					},
				})
			} else {
				nodes = append(nodes, &RawCodeNode{
					Lang: lang,
					Code: code,
					Pos: Pos{
						FileName: fileName,
						Line:     l,
					},
				})
			}
		} else if m[6] != -1 {
			expr := trimmedData[m[6]:m[7]]
			l := getLine(src, baseIndex+m[0])

			nodes = append(nodes, &ExprNode{
				Expr: expr,
				Pos: Pos{
					FileName: fileName,
					Line:     l,
				},
			})
		}

		lastInternalIndex = m[1]
	}

	if lastInternalIndex < len(trimmedData) {
		subText := trimmedData[lastInternalIndex:]
		l := getLine(src, baseIndex+lastInternalIndex)

		nodes = append(nodes, &TextNode{
			Data: subText,
			Pos: Pos{
				FileName: fileName,
				Line:     l,
			},
		})
	}

	return nodes
}

func parseElementNode(node *html.Node, src string, fileName string) (Node, error) {
	tempileType := searchAttr(node.Attr, "type")
	tag := ""
	var attrs []*Attribute
	var data string

	switch tempileType {
	case "doctype":
		doctype := "type=\"doctype\""
		index := strings.Index(src, doctype)
		line := getLine(src, index)
		return &DocumentTypeNode{
			Data: "<!DOCTYPE html>",
			Pos: Pos{
				FileName: fileName,
				Line:     line,
			},
		}, nil
	case "html":
		tag = "html"
		data = "type=\"html\""
		attrs = deleteFromAttrs(node.Attr, "type")
	case "head":
		tag = "head"
		data = "type=\"head\""
		attrs = deleteFromAttrs(node.Attr, "type")
	case "body":
		tag = "body"
		data = "type=\"body\""
		attrs = deleteFromAttrs(node.Attr, "type")
	default:
		tag = strings.ToLower(node.Data)
		attrs = parseAttrs(node.Attr)
		data = "<" + strings.ToLower(node.Data)
	}

	childs, err := parseRawAstToCustomAst(node, src, fileName)
	if err != nil {
		return nil, err
	}

	line, lastIndex := getExactLine(src, sourceMapIndex, data)
	sourceMapIndex = lastIndex
	pos := Pos{
		FileName: fileName,
		Line:     line,
	}

	attrs = parseAttrExpressions(attrs, pos)

	return &ElementNode{
		Tag:    tag,
		Attrs:  attrs,
		Childs: childs,
		Pos:    pos,
	}, nil
}

func parseIfNode(node *html.Node, src string, fileName string) (*IfNode, error) {
	conds := parseAttrs(node.Attr)
	data := "<" + strings.ToLower(node.Data)
	line, lastIndex := getExactLine(src, sourceMapIndex, data)
	sourceMapIndex = lastIndex

	if len(conds) > 0 {

		childs, err := parseRawAstToCustomAst(node, src, fileName)
		if err != nil {
			return nil, err
		}

		ifNode := &IfNode{
			Conds: conds,
			Pos: Pos{
				FileName: fileName,
				Line:     line,
			},
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
	return nil, fmt.Errorf("null conds \n file: %s line: %d", fileName, line)
}

func parseElseIfNode(node *html.Node, src string, fileName string) (*ElseIfNode, error) {
	conds := parseAttrs(node.Attr)
	data := "<" + strings.ToLower(node.Data)
	line, lastIndex := getExactLine(src, sourceMapIndex, data)
	sourceMapIndex = lastIndex

	if len(conds) > 0 {
		childs, err := parseRawAstToCustomAst(node, src, fileName)
		if err != nil {
			return nil, err
		}

		return &ElseIfNode{
			Conds:  conds,
			Childs: childs,
			Pos: Pos{
				FileName: fileName,
				Line:     line,
			},
		}, nil
	}

	return nil, fmt.Errorf("null conds \n file: %s line: %d", fileName, line)
}

func parseElseNode(node *html.Node, src string, fileName string) (*ElseNode, error) {
	childs, err := parseRawAstToCustomAst(node, src, fileName)
	if err != nil {
		return nil, err
	}

	data := "<" + strings.ToLower(node.Data)
	line, lastIndex := getExactLine(src, sourceMapIndex, data)
	sourceMapIndex = lastIndex

	return &ElseNode{
		Childs: childs,
		Pos: Pos{
			FileName: fileName,
			Line:     line,
		},
	}, nil
}

func parseForNode(node *html.Node, src string, fileName string) (*ForNode, error) {
	loops := parseAttrs(node.Attr)
	data := "<" + strings.ToLower(node.Data)
	line, lastIndex := getExactLine(src, sourceMapIndex, data)
	sourceMapIndex = lastIndex

	if len(loops) > 0 {
		childs, err := parseRawAstToCustomAst(node, src, fileName)
		if err != nil {
			return nil, err
		}

		return &ForNode{
			Loops:  loops,
			Childs: childs,
			Pos: Pos{
				FileName: fileName,
				Line:     line,
			},
		}, nil
	}

	return nil, fmt.Errorf("null loop \n file: %s line: %d", fileName, line)
}

func parseIncludeNode(node *html.Node, src string, fileName string) (*IncludeNode, error) {
	ctxId, err := generateId()
	if err != nil {
		return nil, err
	}

	path := searchAttr(node.Attr, "path")

	data := "<" + strings.ToLower(node.Data)
	line, lastIndex := getExactLine(src, sourceMapIndex, data)
	sourceMapIndex = lastIndex

	if path != "" {
		childs, err := parseRawAstToCustomAst(node, src, fileName)
		if err != nil {
			return nil, err
		}

		return &IncludeNode{
			CtxId:  ctxId,
			Path:   path,
			Childs: childs,
			Pos: Pos{
				FileName: fileName,
				Line:     line,
			},
		}, nil
	}

	return nil, fmt.Errorf("null path \n file: %s line: %d", fileName, line)

}

func parseSlotNode(node *html.Node, src string, fileName string) (*SlotNode, error) {
	name := searchAttr(node.Attr, "name")
	data := "<" + strings.ToLower(node.Data)
	line, lastIndex := getExactLine(src, sourceMapIndex, data)
	sourceMapIndex = lastIndex

	if name != "" {
		childs, err := parseRawAstToCustomAst(node, src, fileName)
		if err != nil {
			return nil, err
		}

		return &SlotNode{
			Name:   name,
			Childs: childs,
			Pos: Pos{
				FileName: fileName,
				Line:     line,
			},
		}, nil
	}

	return nil, fmt.Errorf("null slot name \n file: %s line: %d", fileName, line)
}

func parseContentNode(node *html.Node, src string, fileName string) (*ContentNode, error) {
	name := searchAttr(node.Attr, "name")
	data := "<" + strings.ToLower(node.Data)
	line, lastIndex := getExactLine(src, sourceMapIndex, data)
	sourceMapIndex = lastIndex

	if name != "" {
		childs, err := parseRawAstToCustomAst(node, src, fileName)
		if err != nil {
			return nil, err
		}

		return &ContentNode{
			Name:   name,
			Childs: childs,
			Pos: Pos{
				FileName: fileName,
				Line:     line,
			},
		}, nil
	}

	return nil, fmt.Errorf("null content name \n file: %s line: %d", fileName, line)
}

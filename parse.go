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
				importNode, err := parseImportNode(c, src, fileName)

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
		line, col, lastIndex := getExactPos(src, sourceMapIndex, node.Data)
		sourceMapIndex = lastIndex
		return &CommentNode{
			Data: fmt.Sprintf("<!-- %s -->", node.Data),
			Pos: Pos{
				FileName: fileName,
				Line:     line,
				Column:   col,
			},
		}
	}

	return nil
}

func parseTextNode(node *html.Node, src string, fileName string) []Node {
	// Parser bazen sadece boşluk karakterlerinden oluşan düğümler üretir.
	// Eğer tamamen boşsa sourceMapIndex'i kaydırmadan dönüyoruz.
	if strings.TrimSpace(node.Data) == "" {
		return nil
	}

	var nodes []Node

	// node.Data ham metni içerir. Ancak biz bunu orijinal src içinde,
	// kaldığımız yerden itibaren (sourceMapIndex) bulmalıyız.
	// TextNode için getExactPos'u imza olmadan doğrudan metin araması için kullanıyoruz.
	_, _, baseIndex := getExactPos(src, sourceMapIndex, node.Data)

	// sourceMapIndex'i bu text düğümünün bittiği yere çekiyoruz.
	sourceMapIndex = baseIndex + len(node.Data)

	lastInternalIndex := 0
	trimmedData := node.Data

	// Regex ile içindeki {{...}} yapılarını ayıklıyoruz
	for _, m := range reTextNode.FindAllStringSubmatchIndex(trimmedData, -1) {
		// Regex eşleşmesinden önce düz metin varsa onu ekle
		if m[0] > lastInternalIndex {
			subText := trimmedData[lastInternalIndex:m[0]]
			l, c := getPos(src, baseIndex+lastInternalIndex)

			nodes = append(nodes, &TextNode{
				Data: subText,
				Pos: Pos{
					FileName: fileName,
					Line:     l,
					Column:   c,
				},
			})
		}

		// {{ @lang code }} yapısı (RawCodeNode veya RawExprNode)
		if m[2] != -1 {
			lang := trimmedData[m[2]:m[3]]
			code := trimmedData[m[4]:m[5]]
			l, c := getPos(src, baseIndex+m[0])

			if lang == "raw" {
				nodes = append(nodes, &RawExprNode{
					Expr: code,
					Pos: Pos{
						FileName: fileName,
						Line:     l,
						Column:   c,
					},
				})
			} else {
				nodes = append(nodes, &RawCodeNode{
					Lang: lang,
					Code: code,
					Pos: Pos{
						FileName: fileName,
						Line:     l,
						Column:   c,
					},
				})
			}
		} else if m[6] != -1 {
			// Standart {{ expr }} yapısı
			expr := trimmedData[m[6]:m[7]]
			l, c := getPos(src, baseIndex+m[0])

			nodes = append(nodes, &ExprNode{
				Expr: expr,
				Pos: Pos{
					FileName: fileName,
					Line:     l,
					Column:   c,
				},
			})
		}

		lastInternalIndex = m[1]
	}

	// Eğer ifadenin sonunda düz metin kaldıysa onu da ekle
	if lastInternalIndex < len(trimmedData) {
		subText := trimmedData[lastInternalIndex:]
		l, c := getPos(src, baseIndex+lastInternalIndex)

		nodes = append(nodes, &TextNode{
			Data: subText,
			Pos: Pos{
				FileName: fileName,
				Line:     l,
				Column:   c,
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
		line, col := getPos(src, index)
		return &DocumentTypeNode{
			Data: "<!DOCTYPE html>",
			Pos: Pos{
				FileName: fileName,
				Line:     line,
				Column:   col,
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

	line, col, lastIndex := getExactPos(src, sourceMapIndex, data)
	sourceMapIndex = lastIndex

	return &ElementNode{
		Tag:    tag,
		Attrs:  attrs,
		Childs: childs,
		Pos: Pos{
			FileName: fileName,
			Line:     line,
			Column:   col,
		},
	}, nil
}

func parseIfNode(node *html.Node, src string, fileName string) (*IfNode, error) {
	conds := parseAttrs(node.Attr)
	data := "<" + strings.ToLower(node.Data)
	line, col, lastIndex := getExactPos(src, sourceMapIndex, data)
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
				Column:   col,
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
	return nil, fmt.Errorf("null conds \n file: %s line: %d col: %d", fileName, line, col)
}

func parseElseIfNode(node *html.Node, src string, fileName string) (*ElseIfNode, error) {
	conds := parseAttrs(node.Attr)
	data := "<" + strings.ToLower(node.Data)
	line, col, lastIndex := getExactPos(src, sourceMapIndex, data)
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
				Column:   col,
			},
		}, nil
	}

	return nil, fmt.Errorf("null conds \n file: %s line: %d col: %d", fileName, line, col)
}

func parseElseNode(node *html.Node, src string, fileName string) (*ElseNode, error) {
	childs, err := parseRawAstToCustomAst(node, src, fileName)
	if err != nil {
		return nil, err
	}

	data := "<" + strings.ToLower(node.Data)
	line, col, lastIndex := getExactPos(src, sourceMapIndex, data)
	sourceMapIndex = lastIndex

	return &ElseNode{
		Childs: childs,
		Pos: Pos{
			FileName: fileName,
			Line:     line,
			Column:   col,
		},
	}, nil
}

func parseForNode(node *html.Node, src string, fileName string) (*ForNode, error) {
	loops := parseAttrs(node.Attr)
	data := "<" + strings.ToLower(node.Data)
	line, col, lastIndex := getExactPos(src, sourceMapIndex, data)
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
				Column:   col,
			},
		}, nil
	}

	return nil, fmt.Errorf("null loop \n file: %s line: %d col: %d", fileName, line, col)
}

func parseImportNode(node *html.Node, src string, fileName string) (*ImportNode, error) {
	ctxId, err := generateId()
	if err != nil {
		return nil, err
	}

	path := searchAttr(node.Attr, "path")

	data := "<" + strings.ToLower(node.Data)
	line, col, lastIndex := getExactPos(src, sourceMapIndex, data)
	sourceMapIndex = lastIndex

	if path != "" {
		childs, err := parseRawAstToCustomAst(node, src, fileName)
		if err != nil {
			return nil, err
		}

		return &ImportNode{
			CtxId:  ctxId,
			Path:   path,
			Childs: childs,
			Pos: Pos{
				FileName: fileName,
				Line:     line,
				Column:   col,
			},
		}, nil
	}

	return nil, fmt.Errorf("null path \n file: %s line: %d col: %d", fileName, line, col)

}

func parseSlotNode(node *html.Node, src string, fileName string) (*SlotNode, error) {
	name := searchAttr(node.Attr, "name")
	data := "<" + strings.ToLower(node.Data)
	line, col, lastIndex := getExactPos(src, sourceMapIndex, data)
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
				Column:   col,
			},
		}, nil
	}

	return nil, fmt.Errorf("null slot name \n file: %s line: %d col: %d", fileName, line, col)
}

func parseContentNode(node *html.Node, src string, fileName string) (*ContentNode, error) {
	name := searchAttr(node.Attr, "name")
	data := "<" + strings.ToLower(node.Data)
	line, col, lastIndex := getExactPos(src, sourceMapIndex, data)
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
				Column:   col,
			},
		}, nil
	}

	return nil, fmt.Errorf("null content name \n file: %s line: %d col: %d", fileName, line, col)
}

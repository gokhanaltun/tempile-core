package tempilecore

import (
	"crypto/rand"
	"encoding/base64"
	"regexp"
	"strings"

	"golang.org/x/net/html"
)

func searchAttr(attrs []html.Attribute, name string) string {
	for _, a := range attrs {
		if a.Key == name {
			return a.Val
		}
	}
	return ""
}

func parseAttrs(attrs []html.Attribute) []*Attribute {
	var parsedAttrs []*Attribute
	for _, a := range attrs {
		parsedAttrs = append(parsedAttrs, &Attribute{Name: a.Key, Value: a.Val})
	}
	return parsedAttrs
}

func deleteFromAttrs(attrs []html.Attribute, name string) []*Attribute {
	newAttrs := []*Attribute{}
	for _, a := range attrs {
		if a.Key != name {
			newAttrs = append(newAttrs, &Attribute{Name: a.Key, Value: a.Val})
		}
	}
	return newAttrs
}

var attrRegex = regexp.MustCompile(`\{\{(.*?)\}\}`) // Fonksiyon dışında bir kez derle

func parseAttrExpressions(attrs []*Attribute, pos Pos) []*Attribute {
	parsedAttrs := make([]*Attribute, 0, len(attrs))

	for _, a := range attrs {
		parts := []Node{}
		matches := attrRegex.FindAllStringSubmatchIndex(a.Value, -1)

		lastIndex := 0
		for _, m := range matches {
			if m[0] > lastIndex {
				rawText := a.Value[lastIndex:m[0]]
				if strings.TrimSpace(rawText) != "" {
					parts = append(parts, &TextNode{Data: rawText, Pos: pos})
				}
			}

			rawExpr := a.Value[m[2]:m[3]]
			trimmedExpr := strings.TrimSpace(rawExpr)
			if trimmedExpr != "" {
				parts = append(parts, &ExprNode{Expr: trimmedExpr, Pos: pos})
			}
			lastIndex = m[1]
		}

		if lastIndex < len(a.Value) {
			rawText := a.Value[lastIndex:]
			if strings.TrimSpace(rawText) != "" {
				parts = append(parts, &TextNode{Data: rawText, Pos: pos})
			}
		}

		parsedAttrs = append(parsedAttrs, &Attribute{
			Name:       a.Name,
			Value:      a.Value,
			ValueNodes: parts,
		})
	}
	return parsedAttrs
}

func generateId() (string, error) {
	id := make([]byte, 12)

	_, err := rand.Read(id)

	if err != nil {
		return "", err
	}

	return base64.RawStdEncoding.EncodeToString(id), nil
}

func getLine(src string, index int) int {
	line := 1
	for i, ch := range src {
		if i >= index {
			break
		}
		if ch == '\n' {
			line++
		}
	}
	return line
}

func getExactLine(src string, lastOffset int, data string) (line int, endIndex int) {
	if lastOffset >= len(src) {
		lastOffset = len(src) - 1
		if lastOffset < 0 {
			lastOffset = 0
		}
	}
	searchArea := src[lastOffset:]
	index := strings.Index(strings.ToLower(searchArea), strings.ToLower(data))

	if index == -1 {
		return getLine(src, lastOffset), lastOffset
	}

	realIndex := lastOffset + index
	line = getLine(src, realIndex)
	return line, realIndex + len(data)
}

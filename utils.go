package tempilecore

import (
	"crypto/rand"
	"encoding/base64"
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

func generateId() (string, error) {
	id := make([]byte, 12)

	_, err := rand.Read(id)

	if err != nil {
		return "", err
	}

	return base64.RawStdEncoding.EncodeToString(id), nil
}

func getPos(src string, index int) (line int, column int) {
	line = 1
	column = 1

	for i, ch := range src {
		if i >= index {
			break
		}
		if ch == '\n' {
			line++
			column = 1
		} else {
			column++
		}
	}
	return
}

func getExactPos(src string, lastOffset int, data string) (int, int, int) {
	if lastOffset >= len(src) {
		lastOffset = len(src) - 1
		if lastOffset < 0 {
			lastOffset = 0
		}
	}

	searchArea := src[lastOffset:]
	index := strings.Index(strings.ToLower(searchArea), strings.ToLower(data))

	if index == -1 {
		l, c := getPos(src, lastOffset)
		return l, c, lastOffset
	}

	realIndex := lastOffset + index
	line, col := getPos(src, realIndex)

	return line, col, realIndex + len(data)
}

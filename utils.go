package tempilecore

import "golang.org/x/net/html"

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

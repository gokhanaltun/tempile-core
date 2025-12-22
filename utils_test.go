package tempilecore

import (
	"testing"

	"golang.org/x/net/html"
)

func TestSearchAttr(t *testing.T) {
	attrs := []html.Attribute{
		{Key: "id", Val: "main"},
		{Key: "class", Val: "container"},
	}

	val := searchAttr(attrs, "class")
	if val != "container" {
		t.Fatalf("expected 'container', got %q", val)
	}

	val = searchAttr(attrs, "style")
	if val != "" {
		t.Fatalf("expected empty string, got %q", val)
	}
}

func TestParseAttrs(t *testing.T) {
	attrs := []html.Attribute{
		{Key: "id", Val: "main"},
		{Key: "class", Val: "container"},
	}

	parsed := parseAttrs(attrs)
	if len(parsed) != 2 {
		t.Fatalf("expected 2 attributes, got %d", len(parsed))
	}

	if parsed[0].Name != "id" || parsed[0].Value != "main" {
		t.Fatalf("first attribute incorrect: %+v", parsed[0])
	}
}

func TestDeleteFromAttrs(t *testing.T) {
	attrs := []html.Attribute{
		{Key: "id", Val: "main"},
		{Key: "type", Val: "html"},
	}

	result := deleteFromAttrs(attrs, "type")
	if len(result) != 1 {
		t.Fatalf("expected 1 attribute after deletion, got %d", len(result))
	}
	if result[0].Name != "id" {
		t.Fatalf("remaining attribute should be 'id', got %s", result[0].Name)
	}
}

func TestParseAttrExpressions_Direct(t *testing.T) {
	pos := Pos{FileName: "test.html", Line: 1, Column: 1}
	attrs := []*Attribute{
		{Name: "class", Value: "a {{b}} c"},
	}

	parsed := parseAttrExpressions(attrs, pos)
	if len(parsed) != 1 {
		t.Fatalf("expected 1 attribute, got %d", len(parsed))
	}

	attr := parsed[0]
	if len(attr.ValueNodes) != 3 {
		t.Fatalf("expected 3 value nodes, got %d", len(attr.ValueNodes))
	}

	txt1, ok := attr.ValueNodes[0].(*TextNode)
	if !ok || txt1.Data != "a " {
		t.Fatalf("first node should be TextNode 'a '")
	}

	expr, ok := attr.ValueNodes[1].(*ExprNode)
	if !ok || expr.Expr != "b" {
		t.Fatalf("second node should be ExprNode 'b'")
	}

	txt2, ok := attr.ValueNodes[2].(*TextNode)
	if !ok || txt2.Data != " c" {
		t.Fatalf("third node should be TextNode ' c'")
	}
}

func TestGenerateId(t *testing.T) {
	id, err := generateId()
	if err != nil {
		t.Fatal(err)
	}

	if id == "" {
		t.Fatal("expected non-empty id")
	}

	if len(id) < 12 {
		t.Fatalf("id too short, got %d characters", len(id))
	}
}

func TestGetLineAndExactLine(t *testing.T) {
	src := `Line 1
Line 2
Line 3
Some text here
Another line
`

	line := getLine(src, 0)
	if line != 1 {
		t.Fatalf("expected line 1, got %d", line)
	}

	line = getLine(src, 10)
	if line != 2 {
		t.Fatalf("expected line 2, got %d", line)
	}

	line = getLine(src, len(src)-1)
	if line != 5 {
		t.Fatalf("expected line 5, got %d", line)
	}

	l, end := getExactLine(src, 0, "Line 3")
	if l != 3 {
		t.Fatalf("expected exact line 3, got %d", l)
	}
	if end <= 0 || end > len(src) {
		t.Fatalf("unexpected end index: %d", end)
	}

	l, end = getExactLine(src, 0, "NotHere")
	if l != 1 {
		t.Fatalf("expected fallback line 1, got %d", l)
	}
	if end != 0 {
		t.Fatalf("expected fallback end index 0, got %d", end)
	}

	l, end = getExactLine(src, 0, "Another line")
	if l != 5 {
		t.Fatalf("expected line 5, got %d", l)
	}
	if end <= 0 || end > len(src) {
		t.Fatalf("unexpected end index: %d", end)
	}
}

package tempilecore

import (
	"testing"
)

func TestTextExpr(t *testing.T) {
	src := `Hello {{name}}`

	root, err := Parse(src, "expr.html")
	if err != nil {
		t.Fatal(err)
	}

	if len(root.Childs) != 2 {
		t.Fatalf("expected 2 nodes, got %d", len(root.Childs))
	}

	txt, ok := root.Childs[0].(*TextNode)
	if !ok {
		t.Fatalf("first node should be TextNode")
	}
	if txt.Data != "Hello " {
		t.Fatalf("unexpected text: %q", txt.Data)
	}

	expr, ok := root.Childs[1].(*ExprNode)
	if !ok {
		t.Fatalf("second node should be ExprNode")
	}
	if expr.Expr != "name" {
		t.Fatalf("unexpected expr: %q", expr.Expr)
	}
}

func TestRawExpr(t *testing.T) {
	src := `{{@raw html}}`

	root, err := Parse(src, "raw.tpl")
	if err != nil {
		t.Fatal(err)
	}

	if len(root.Childs) != 1 {
		t.Fatalf("expected 1 node, got %d", len(root.Childs))
	}

	raw, ok := root.Childs[0].(*RawExprNode)
	if !ok {
		t.Fatalf("expected RawExprNode, got %T", root.Childs[0])
	}

	if raw.Expr != "html" {
		t.Fatalf("unexpected raw expr: %q", raw.Expr)
	}
}

func TestRawCode(t *testing.T) {
	src := `{{@js console.log(1)}}`

	root, err := Parse(src, "rawcode.tpl")
	if err != nil {
		t.Fatal(err)
	}

	if len(root.Childs) != 1 {
		t.Fatalf("expected 1 node, got %d", len(root.Childs))
	}

	rc, ok := root.Childs[0].(*RawCodeNode)
	if !ok {
		t.Fatalf("expected RawCodeNode, got %T", root.Childs[0])
	}

	if rc.Lang != "js" {
		t.Fatalf("unexpected lang: %q", rc.Lang)
	}

	if rc.Code != "console.log(1)" {
		t.Fatalf("unexpected code: %q", rc.Code)
	}
}

func TestAttributeExpr(t *testing.T) {
	src := `<div class="a {{b}} c"></div>`

	root, err := Parse(src, "attr.tpl")
	if err != nil {
		t.Fatal(err)
	}

	if len(root.Childs) != 1 {
		t.Fatalf("expected 1 root child")
	}

	div, ok := root.Childs[0].(*ElementNode)
	if !ok {
		t.Fatalf("expected ElementNode")
	}

	if len(div.Attrs) != 1 {
		t.Fatalf("expected 1 attribute")
	}

	attr := div.Attrs[0]

	if attr.Name != "class" {
		t.Fatalf("expected class attr, got %s", attr.Name)
	}

	if len(attr.ValueNodes) != 3 {
		t.Fatalf("expected 3 value nodes, got %d", len(attr.ValueNodes))
	}

	// a
	txt1, ok := attr.ValueNodes[0].(*TextNode)
	if !ok || txt1.Data != "a " {
		t.Fatalf("first node should be TextNode 'a '")
	}

	// {{b}}
	expr, ok := attr.ValueNodes[1].(*ExprNode)
	if !ok || expr.Expr != "b" {
		t.Fatalf("second node should be ExprNode 'b'")
	}

	// c
	txt2, ok := attr.ValueNodes[2].(*TextNode)
	if !ok || txt2.Data != " c" {
		t.Fatalf("third node should be TextNode ' c'")
	}
}

func TestIfElseParsing_CodeDirect(t *testing.T) {
	src := `
<if cond="a > 0">
  A
  <elseif cond="b < 5">B</elseif>
  <else>C</else>
</if>
`

	root, err := Parse(src, "if.tpl")
	if err != nil {
		t.Fatal(err)
	}

	if len(root.Childs) != 1 {
		t.Fatalf("expected 1 root child, got %d", len(root.Childs))
	}

	ifNode, ok := root.Childs[0].(*IfNode)
	if !ok {
		t.Fatalf("expected IfNode")
	}

	if len(ifNode.Conds) != 1 || ifNode.Conds[0].Value != "a > 0" {
		t.Fatalf("if cond not parsed correctly, got %q", ifNode.Conds[0].Value)
	}

	if len(ifNode.Then) != 1 {
		t.Fatalf("expected 1 Then node, got %d", len(ifNode.Then))
	}
	txtThen := ifNode.Then[0].(*TextNode)
	if txtThen.Data != "A" && txtThen.Data != "\n  A\n  " {
		t.Fatalf("unexpected Then content: %q", txtThen.Data)
	}

	if len(ifNode.ElseIfNodes) != 1 {
		t.Fatalf("expected 1 ElseIf node")
	}
	elseif := ifNode.ElseIfNodes[0]
	if elseif.Conds[0].Value != "b < 5" {
		t.Fatalf("elseif cond not parsed correctly, got %q", elseif.Conds[0].Value)
	}

	if ifNode.Else == nil || ifNode.Else.Childs[0].(*TextNode).Data != "C" {
		t.Fatalf("else node content incorrect")
	}
}

func TestForParsing(t *testing.T) {
	src := `
<for loop="i := 0; i < 10; i++">
  Item
</for>
`

	root, err := Parse(src, "for.tpl")
	if err != nil {
		t.Fatal(err)
	}

	if len(root.Childs) != 1 {
		t.Fatalf("expected 1 root child, got %d", len(root.Childs))
	}

	forNode, ok := root.Childs[0].(*ForNode)
	if !ok {
		t.Fatalf("expected ForNode")
	}

	if len(forNode.Loops) != 1 || forNode.Loops[0].Value != "i := 0; i < 10; i++" {
		t.Fatalf("loop not parsed correctly, got %q", forNode.Loops[0].Value)
	}

	if len(forNode.Childs) != 1 {
		t.Fatalf("expected 1 child inside for, got %d", len(forNode.Childs))
	}

	txt := forNode.Childs[0].(*TextNode)
	if txt.Data != "Item" && txt.Data != "\n  Item\n" {
		t.Fatalf("unexpected for content: %q", txt.Data)
	}
}

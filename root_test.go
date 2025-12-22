package tempilecore

import (
	"os"
	"testing"
)

func TestImportParsing(t *testing.T) {
	content := `<div>Header</div>`
	err := os.WriteFile("header.html", []byte(content), 0644)
	if err != nil {
		t.Fatal(err)
	}
	defer os.Remove("header.html")

	src := `<import path="header.html"></import>`

	root, err := Parse(src, "main.html")
	if err != nil {
		t.Fatal(err)
	}

	root.ResolveImports("./")

	if len(root.Childs) != 1 {
		t.Fatalf("expected 1 root child, got %d", len(root.Childs))
	}

	importNode, ok := root.Childs[0].(*ImportNode)
	if !ok {
		t.Fatalf("expected ImportNode")
	}

	if importNode.Path != "header.html" {
		t.Fatalf("expected path 'header.html', got %q", importNode.Path)
	}

	if len(importNode.Childs) != 1 {
		t.Fatalf("expected 1 child in import, got %d", len(importNode.Childs))
	}

	div, ok := importNode.Childs[0].(*ElementNode)
	if !ok || div.Tag != "div" {
		t.Fatalf("expected child div element, got %T %v", importNode.Childs[0], importNode.Childs[0])
	}
}

func TestNestedSlotContent(t *testing.T) {
	header := `<slot name="header"><div>Default Header</div></slot>`
	os.WriteFile("header.html", []byte(header), 0644)
	defer os.Remove("header.html")

	main := `
<import path="header.html">
  <content name="header"><h1>Custom Header</h1></content>
</import>
`
	root, err := Parse(main, "main.html")
	if err != nil {
		t.Fatal(err)
	}

	root.ResolveImports("./")
	root.MatchSlotsAndContents()

	if len(root.Childs) != 2 {
		t.Fatalf("expected 2 root children after unwrap (default + content), got %d", len(root.Childs))
	}

	div, ok := root.Childs[0].(*ElementNode)
	if !ok || div.Tag != "div" {
		t.Fatalf("expected first child div element (default slot), got %T %v", root.Childs[0], root.Childs[0])
	}

	h1, ok := root.Childs[1].(*ElementNode)
	if !ok || h1.Tag != "h1" {
		t.Fatalf("expected second child h1 element from content, got %T %v", root.Childs[1], root.Childs[1])
	}
}

func TestNestedImportWithSlotContent(t *testing.T) {
	os.WriteFile("header.html", []byte(`<div>Header</div>`), 0644)
	defer os.Remove("header.html")

	os.WriteFile("footer.html", []byte(`<div>Footer</div>`), 0644)
	defer os.Remove("footer.html")

	layout := `
<import path="header.html"></import>
<slot name="body"></slot>
<import path="footer.html"></import>
`
	os.WriteFile("layout.html", []byte(layout), 0644)
	defer os.Remove("layout.html")

	main := `
<import path="layout.html">
  <content name="body"><p>Main Content</p></content>
</import>
`

	root, err := Parse(main, "main.html")
	if err != nil {
		t.Fatal(err)
	}

	root.ResolveImports("./")
	root.MatchSlotsAndContents()

	if len(root.Childs) != 3 {
		t.Fatalf("expected 3 root children after unwrap (header, p, footer), got %d", len(root.Childs))
	}

	header := root.Childs[0].(*ElementNode)
	if header.Tag != "div" || header.Childs[0].(*TextNode).Data != "Header" {
		t.Fatalf("unexpected header element: %+v", header)
	}

	p := root.Childs[1].(*ElementNode)
	if p.Tag != "p" || p.Childs[0].(*TextNode).Data != "Main Content" {
		t.Fatalf("unexpected main content element: %+v", p)
	}

	footer := root.Childs[2].(*ElementNode)
	if footer.Tag != "div" || footer.Childs[0].(*TextNode).Data != "Footer" {
		t.Fatalf("unexpected footer element: %+v", footer)
	}
}

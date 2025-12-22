# Tempile Core

**Tempile Core** is the central package for parsing [Tempile template syntax](https://github.com/gokhanaltun/tempile) into an AST (Abstract Syntax Tree). It reads template files, converts HTML-based templates into structured nodes, and manages relationships such as imports, slots, and content insertion.

## Features

* Parses modern HTML-based template syntax.
* Produces an AST including elements, `if`/`elseif`/`else` blocks, `for` loops, slots, content nodes, and raw code/expressions.
* Resolves `<import>` nodes, merging their children into the parent template.
* Matches slots and content nodes for dynamic template composition.
* Tracks line numbers (`Pos.Line`) for nodes; column tracking has been removed for simplicity.

## Usage

```go
package main

import (
    "fmt"
    "os"

    tempilecore "github.com/gokhanaltun/tempile-core"
)

func main() {
    templateByte, err := os.ReadFile("./template.html")
    if err != nil {
        panic(err)
    }

    // Parse the template and build the AST
    ast, err := tempilecore.Parse(string(templateByte), "template.html")
    if err != nil {
        panic(err)
    }

    // Resolve <import> nodes
    ast.ResolveImports("./")

    // Match slots and content nodes
    ast.MatchSlotsAndContents()

    // AST is now ready for a compiler or further processing
    fmt.Printf("%+v\n", ast)
}
```

## Structure

* `Root` – The root node of the AST, containing all child nodes.
* `Node` interface – Covers different node types: `Element`, `Text`, `Comment`, `If`, `For`, `Import`, `Slot`, `Content`, `RawCode`, `RawExpr`, `Expr`.
* `ResolveImports` – Resolves import nodes in the AST and merges their child nodes into the parent.
* `MatchSlotsAndContents` – Matches slot and content nodes and flattens the AST.

## AST Node Types

All AST nodes implement the `Node` interface.

| Node Type      | Struct             | Fields                                                                             | Description                                                    |
| -------------- | ------------------ | ---------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `DocumentType` | `DocumentTypeNode` | `Data string`                                                                      | Document type declaration (`<!DOCTYPE html>`).                 |
| `Comment`      | `CommentNode`      | `Data string`                                                                      | HTML comment.                                                  |
| `Text`         | `TextNode`         | `Data string`                                                                      | Plain text inside elements.                                    |
| `Element`      | `ElementNode`      | `Tag string`, `Attrs []*Attribute`, `Childs []Node`                                | HTML element or template element with attributes and children. |
| `If`           | `IfNode`           | `Conds []*Attribute`, `Then []Node`, `ElseIfNodes []*ElseIfNode`, `Else *ElseNode` | Conditional block with optional `elseif`/`else`.               |
| `ElseIf`       | `ElseIfNode`       | `Conds []*Attribute`, `Childs []Node`                                              | `elseif` block of an if-statement.                             |
| `Else`         | `ElseNode`         | `Childs []Node`                                                                    | `else` block of an if-statement.                               |
| `For`          | `ForNode`          | `Loops []*Attribute`, `Childs []Node`                                              | Loop block.                                                    |
| `Import`       | `ImportNode`       | `Path string`, `Childs []Node`                                                     | `<import>` node referencing another template.                  |
| `Slot`         | `SlotNode`         | `Name string`, `Childs []Node`                                                     | Slot placeholder to be filled by content nodes.                |
| `Content`      | `ContentNode`      | `Name string`, `Childs []Node`                                                     | Content to be inserted into a slot.                            |
| `Expr`         | `ExprNode`         | `Expr string`                                                                      | Template expression (`{{ ... }}`).                             |
| `RawExpr`      | `RawExprNode`      | `Expr string`                                                                      | Raw expression block (`{{@raw ...}}`).                         |
| `RawCode`      | `RawCodeNode`      | `Lang string`, `Code string`                                                       | Raw code block in a specific language (`{{@js ...}}`).         |

### Attribute

```go
type Attribute struct {
    Name       string
    Value      string
    ValueNodes []Node
}
```

*Attributes hold element attributes, or conditions/loop definitions for `If`, `ElseIf`, and `For` nodes.*

## Notes

* **Tempile Core** only parses templates and builds the AST.
* Compilation of the AST to a target language or runtime code is handled by language-specific compiler packages.
* Line tracking (`Pos.Line`) is maintained for all nodes; column tracking has been removed to simplify parsing.
* Slots, content, and import resolution are done at the AST level, making it reusable for multiple targets.

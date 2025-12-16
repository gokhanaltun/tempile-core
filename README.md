# Tempile Core

**Tempile Core** is the core package that parses [Tempile template syntax](https://github.com/gokhanaltun/tempile) and produces an AST (Abstract Syntax Tree). It processes template files, builds nodes, and manages their relationships.

## Features

* Parses modern HTML-based template syntax.
* Produces an AST including elements, if/elseif/else blocks, for loops, slots, content nodes, and raw code/expressions.
* Resolves `<import>` nodes, merging their children into the parent template.
* Matches slots and content nodes.

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
    ast, err := tempilecore.Parse(string(templateByte))
    if err != nil {
        panic(err)
    }

    // Resolve <import> nodes
    err = ast.ResolveImports("./")
    if err != nil {
        panic(err)
    }

    // Match slots and content nodes
    ast.MatchSlotsAndContents()

    // AST is now ready for a compiler or further processing
    fmt.Printf("%+v\n", ast)
}
```

## Structure

* `Root` – The root node of the AST, containing all child nodes.
* `Node` interface – Covers different node types: Element, Text, Comment, If, For, Import, Slot, Content, RawCode, RawExpr, Expr.
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
| `If`           | `IfNode`           | `Conds []*Attribute`, `Then []Node`, `ElseIfNodes []*ElseIfNode`, `Else *ElseNode` | Conditional block with optional elseif/else.                   |
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
    Name  string
    Value string
}
```

*Attributes are used in If, ElseIf, and For nodes to hold conditions or loop definitions.*

## Example AST

```json
[
  {"Data":"<!DOCTYPE html>"},
  {
    "Tag":"html",
    "Attrs":[{"Name":"lang","Value":"en"}],
    "Childs":[
      {
        "Tag":"head",
        "Attrs":[],
        "Childs":[
          {"Tag":"meta","Attrs":[{"Name":"charset","Value":"UTF-8"}],"Childs":[]},
          {"Tag":"title","Attrs":[],"Childs":[{"Data":"Page Title"}]}
        ]
      },
      {
        "Tag":"body",
        "Attrs":[],
        "Childs":[
          {"Tag":"h1","Attrs":[],"Childs":[{"Data":"Page Body"}]}
        ]
      }
    ]
  }
]
```

## Notes

* **Tempile Core** only parses templates and builds the AST.
* Compilation of the AST to a specific language or runtime code is handled by language-specific compiler packages.
* Slots, content, and import resolution are done at the AST level, making it reusable for multiple targets.

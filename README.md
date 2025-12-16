# Tempile Core

**Tempile Core** is the core package that parses [Tempile template syntax](https://github.com/gokhanaltun/tempile) and produces an AST (Abstract Syntax Tree). It processes template files, builds nodes, and manages their relationships.

## Features

* Parses modern HTML-based template syntax.
* Produces an AST including elements, if/elseif/else blocks, for loops, slots, and content nodes.
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
* `Node` interface – Covers different node types: Element, Text, Comment, If, For, Import, Slot, Content.
* `ResolveImports` – Resolves import nodes in the AST and merges their child nodes into the parent.
* `MatchSlotsAndContents` – Matches slot and content nodes and flattens the AST.


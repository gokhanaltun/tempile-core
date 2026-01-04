# Tempile Core

A powerful multi-language template engine core that parses templates with custom syntax and generates an Abstract Syntax Tree (AST). This library is designed for compiler developers who want to build language-specific compilers for the Tempile template system.

## Overview

Tempile Core is the foundation of the Tempile template engine ecosystem. It handles the parsing of template files and produces a structured AST that can be transformed into native code for any target language.

### Architecture

The Tempile ecosystem consists of three main components:

1. **Core** (this package) - Parses templates and generates AST
2. **Compiler** - Transforms AST into target language native code
3. **CLI** - Orchestrates core and compilers, handles file and config management

## Installation

```bash
npm install tempile-core
```

## Quick Start

```javascript
import { parse } from 'tempile-core';
import fs from 'fs';

// Read template file
const template = fs.readFileSync('template.html', 'utf-8');

// Parse template and get AST root
const root = parse(template, 'template.html');

// Resolve includes (if template uses <include> tags)
root.resolveIncludes('./src');

// Match slots with contents (for component composition)
root.matchSlotsAndContents();

// Now you can traverse the AST and generate target code
```

## API Reference

### Core Functions

#### `parse(source: string, fileName: string): Root`

Parses a template string and returns the root AST node.

**Parameters:**
- `source` - Template content as string
- `fileName` - Name of the template file (used in error messages and position tracking)

**Returns:** `Root` object containing the parsed AST

**Example:**
```javascript
const root = parse('<div>Hello {{name}}</div>', 'greeting.html');
```

### Root Class

The `Root` class represents the top-level AST node and provides methods for post-processing.

#### Properties

- `children: Node[]` - Array of child nodes
- `fileName: string` - Source file name

#### Methods

##### `resolveIncludes(srcPath: string): void`

Recursively resolves all `<include>` tags by reading and parsing the referenced files. Must be called before `matchSlotsAndContents()` if your templates use includes.

**Parameters:**
- `srcPath` - Base directory path for resolving relative include paths

**Throws:**
- Error if circular includes are detected
- Error if included file cannot be read

**Example:**
```javascript
root.resolveIncludes('./templates');
```

##### `matchSlotsAndContents(): void`

Matches `<content>` nodes with their corresponding `<slot>` nodes in included templates. This enables component composition by filling slots with provided content.

Must be called after `resolveIncludes()` if using the slot/content system.

**Example:**
```javascript
root.resolveIncludes('./templates');
root.matchSlotsAndContents(); // Slots are now filled with contents
```

## AST Node Types

All nodes extend the abstract `Node` class and include position information for error reporting.

### Base Node Structure

```typescript
abstract class Node {
    type: NodeType;
    pos: Pos | null | undefined;
    abstract getChildren(): Node[];
}
```

### Position Information

```typescript
type Pos = {
    fileName: string;
    startLine?: number;
    startCol?: number;
    startOffset?: number;
    endLine?: number;
    endCol?: number;
    endOffset?: number;
}
```

### Node Types Enum

```typescript
enum NodeType {
    Import = "import",
    Doctype = "doctype",
    Tempile = "tempile",
    Comment = "comment",
    Text = "text",
    Element = "element",
    If = "if",
    ElseIf = "elseif",
    Else = "else",
    For = "for",
    Include = "include",
    Slot = "slot",
    Content = "content",
    Out = "out",
    Logic = "logic",
}
```

### HTML Nodes

#### TextNode

Represents plain text content.

```typescript
class TextNode extends Node {
    type: NodeType.Text;
    data: string;
    getChildren(): [] // No children
}
```

#### CommentNode

Represents HTML comments.

```typescript
class CommentNode extends Node {
    type: NodeType.Comment;
    data: string;
    getChildren(): [] // No children
}
```

#### ElementNode

Represents standard HTML elements.

```typescript
class ElementNode extends Node {
    type: NodeType.Element;
    tag: string;
    attrs: Attribute[];
    children: Node[];
    getChildren(): Node[]
}
```

**Attribute Structure:**
```typescript
type Attribute = {
    name: string;
    value: string;
    valueNodes?: AttrValueNode[]; // Parsed interpolations
    pos: Pos;
}

type AttrValueNode =
    | { type: "text"; value: string }
    | { type: "expr"; value: string }
```

Attributes can contain expressions using `{{expression}}` syntax. The `valueNodes` array contains parsed segments alternating between text and expressions.

**Example:**
```html
<div class="btn {{variant}} {{size}}">
```
Results in:
```javascript
{
    name: "class",
    value: "btn {{variant}} {{size}}",
    valueNodes: [
        { type: "text", value: "btn " },
        { type: "expr", value: "variant" },
        { type: "text", value: " " },
        { type: "expr", value: "size" }
    ]
}
```

#### DoctypeNode

Represents the DOCTYPE declaration.

```typescript
class DoctypeNode extends Node {
    type: NodeType.Doctype;
    data: string; // "<!DOCTYPE html>"
    getChildren(): [] // No children
}
```

### Control Flow Nodes

#### IfNode

Represents conditional rendering with optional elseif and else branches.

```typescript
class IfNode extends Node {
    type: NodeType.If;
    conditions: Attribute[]; // Multi-language conditions
    ifContent: Node[]; // Content when condition is true
    elseIfNodes: ElseIfNode[]; // Optional elseif branches
    elseNode?: ElseNode; // Optional else branch
    getChildren(): Node[] // Returns ifContent
}
```

**Template Syntax:**
```html
<if @js="user.age >= 18" @go="user.Age >= 18">
    <p>Adult content</p>
    <elseif @js="user.age >= 13" @go="user.Age >= 13">
        <p>Teen content</p>
    </elseif>
    <else>
        <p>Child content</p>
    </else>
</if>
```

#### ElseIfNode

Represents an elseif branch within an if statement.

```typescript
class ElseIfNode extends Node {
    type: NodeType.ElseIf;
    conditions: Attribute[]; // Multi-language conditions
    children: Node[];
    getChildren(): Node[]
}
```

**Validation:**
- Must be a direct child of `<if>` tag
- Requires at least one `@[lang]` condition attribute

#### ElseNode

Represents an else branch within an if statement.

```typescript
class ElseNode extends Node {
    type: NodeType.Else;
    children: Node[];
    getChildren(): Node[]
}
```

**Validation:**
- Must be a direct child of `<if>` tag
- Only one `<else>` per `<if>` block allowed

#### ForNode

Represents loop iteration.

```typescript
class ForNode extends Node {
    type: NodeType.For;
    loops: Attribute[]; // Multi-language loop expressions
    children: Node[];
    getChildren(): Node[]
}
```

**Template Syntax:**
```html
<for @js="const item of items" @go="_, item := range items">
    <p>{{item.name}}</p>
</for>
```

### Feature Nodes

#### ImportNode

Allows importing dependencies for specific target languages. Only text and comment nodes are allowed as children.

```typescript
class ImportNode extends Node {
    type: NodeType.Import;
    lang: string; // Target language (e.g., "js", "go")
    data: Node[]; // Text/Comment nodes containing import statements
    getChildren(): Node[]
}
```

**Template Syntax:**
```html
<import @js>
import axios from 'axios';
import { helper } from './utils';
</import>

<import @go>
"fmt"
"github.com/user/package"
</import>
```

**Validation:**
- Must be at document root level (not nested in other elements)
- Only one `@[lang]` attribute allowed
- Only text and comment nodes as children

#### TempileNode

Special node for wrapping HTML structural elements (doctype, html, head, body). This provides easier parsing and allows attributes on these elements.

```typescript
class TempileNode extends Node {
    type: NodeType.Tempile;
    nodeTypeData: string; // "doctype" | "html" | "head" | "body"
    attrs: Attribute[];
    children: Node[];
    getChildren(): Node[]
}
```

**Template Syntax:**
```html
<tempile @doctype></tempile>
<tempile @html lang="en">
    <tempile @head>
        <meta charset="UTF-8">
        <title>Page Title</title>
    </tempile>
    <tempile @body>
        <!-- Content here -->
    </tempile>
</tempile>
```

**Note:** For `@doctype`, a `DoctypeNode` is created instead during parsing.

#### IncludeNode

Includes external template files and enables component composition.

```typescript
class IncludeNode extends Node {
    type: NodeType.Include;
    ctxId: string; // Unique context ID for slot matching
    path: Attribute; // Path to included file
    children: Node[]; // Content nodes to fill slots
    getChildren(): Node[]
}
```

**Template Syntax:**
```html
<!-- Simple include without slot filling -->
<include @path="components/header.html"></include>

<!-- Include with slot content -->
<include @path="layouts/main.html">
    <content @name="sidebar">
        <nav>Navigation items</nav>
    </content>
    <content @name="main">
        <h1>Page content</h1>
    </content>
</include>
```

**How it works:**
1. Parser creates `IncludeNode` with unique `ctxId`
2. `resolveIncludes()` reads and parses the referenced file
3. Parsed content is added to `IncludeNode.children`
4. `matchSlotsAndContents()` matches `ContentNode`s with `SlotNode`s using `ctxId`

#### SlotNode

Defines a placeholder in a template that can be filled with content from an include.

```typescript
class SlotNode extends Node {
    type: NodeType.Slot;
    name: string; // Slot identifier
    children: Node[]; // Default content (if not filled)
    getChildren(): Node[]
}
```

**Template Syntax:**
```html
<!-- In layout.html -->
<div class="layout">
    <slot @name="header">
        <h1>Default Header</h1>
    </slot>
    <slot @name="content">
        <p>Default content</p>
    </slot>
</div>
```

**Usage in parent template:**
```html
<include @path="layout.html">
    <content @name="header">
        <h1>Custom Header</h1>
    </content>
</include>
```

#### ContentNode

Provides content to fill a slot in an included template. Must be a direct child of `<include>`.

```typescript
class ContentNode extends Node {
    type: NodeType.Content;
    name: string; // Target slot name
    children: Node[];
    getChildren(): Node[]
}
```

**Validation:**
- Must be a direct child of `<include>` tag
- Only one `@[name]` attribute allowed

**After processing:**
- `ContentNode`s are removed from the tree
- Their children are moved into matching `SlotNode`s
- Unmatched slots keep their default content

#### OutNode

Outputs an expression value. By default, content is escaped for security. Use `@raw` to output unescaped HTML.

```typescript
class OutNode extends Node {
    type: NodeType.Out;
    data: string; // Expression to output
    isRaw: boolean; // Whether to escape output
    getChildren(): [] // No children
}
```

**Template Syntax:**
```html
<!-- Escaped output (safe) -->
<out>user.name</out>

<!-- Raw output (dangerous - use with caution) -->
<out @raw>article.htmlContent</out>
```

**Validation:**
- Only text nodes allowed as children
- Maximum one attribute (`@raw`)

#### LogicNode

Embeds native code in the target language within the template. Code is not isolated and can access variables from other parts of the template.

```typescript
class LogicNode extends Node {
    type: NodeType.Logic;
    lang: string; // Target language
    data: string; // Native code
    getChildren(): [] // No children
}
```

**Template Syntax:**
```html
<logic @js>
const user = getUser();
const isAdmin = user.role === 'admin';
</logic>

<if @js="isAdmin">
    <p>Admin panel</p>
</if>

<logic @go>
user := getUser()
isAdmin := user.Role == "admin"
</logic>
```

**Validation:**
- Only one `@[lang]` attribute allowed
- Only text nodes as children

## Template Syntax Guide

### Multi-Language Support

Most control structures and logic nodes support multiple target languages through `@[lang]` attributes. This allows a single template to be compiled to different languages.

```html
<if @js="count > 0" @go="count > 0" @python="count > 0">
    <p>Has items</p>
</if>
```

### Expression Interpolation

Use `{{expression}}` syntax within attribute values:

```html
<div 
    class="card {{variant}}" 
    data-id="{{item.id}}"
    style="width: {{width}}px">
</div>
```

Expressions are parsed into `AttrValueNode` arrays for easy processing by compilers.

### Component Composition

Tempile provides a powerful slot/content system for building reusable components:

**1. Create a layout with slots:**
```html
<!-- layouts/base.html -->
<tempile @html>
<tempile @head>
    <slot @name="head-extra"></slot>
</tempile>
<tempile @body>
    <header>
        <slot @name="header">
            <h1>Default Site Title</h1>
        </slot>
    </header>
    <main>
        <slot @name="content"></slot>
    </main>
</tempile>
</tempile>
```

**2. Use the layout and fill slots:**
```html
<!-- pages/home.html -->
<include @path="layouts/base.html">
    <content @name="head-extra">
        <link rel="stylesheet" href="home.css">
    </content>
    <content @name="header">
        <h1>Welcome Home</h1>
        <nav>...</nav>
    </content>
    <content @name="content">
        <p>Homepage content</p>
    </content>
</include>
```

## Building a Compiler

To build a compiler for Tempile, you need to:

1. Parse templates using `parse()`
2. Process includes and slots
3. Traverse the AST
4. Generate native code for your target language

### Basic Compiler Structure

```javascript
import { parse, NodeType } from 'tempile-core';

class MyCompiler {
    compile(source, fileName) {
        // 1. Parse
        const root = parse(source, fileName);
        
        // 2. Resolve includes
        root.resolveIncludes('./templates');
        
        // 3. Match slots with contents
        root.matchSlotsAndContents();
        
        // 4. Generate code
        return this.generateCode(root.children);
    }
    
    generateCode(nodes) {
        let code = '';
        
        for (const node of nodes) {
            switch (node.type) {
                case NodeType.Text:
                    code += this.generateText(node);
                    break;
                case NodeType.Element:
                    code += this.generateElement(node);
                    break;
                case NodeType.If:
                    code += this.generateIf(node);
                    break;
                case NodeType.For:
                    code += this.generateFor(node);
                    break;
                case NodeType.Out:
                    code += this.generateOut(node);
                    break;
                case NodeType.Logic:
                    code += this.generateLogic(node);
                    break;
                case NodeType.Import:
                    code += this.generateImport(node);
                    break;
                // Handle other node types...
            }
        }
        
        return code;
    }
    
    generateIf(node) {
        // Get condition for your target language
        const condition = node.conditions.find(c => c.name === 'js');
        
        let code = `if (${condition.value}) {\n`;
        code += this.generateCode(node.ifContent);
        
        for (const elseif of node.elseIfNodes) {
            const elseifCond = elseif.conditions.find(c => c.name === 'js');
            code += `} else if (${elseifCond.value}) {\n`;
            code += this.generateCode(elseif.children);
        }
        
        if (node.elseNode) {
            code += `} else {\n`;
            code += this.generateCode(node.elseNode.children);
        }
        
        code += `}\n`;
        return code;
    }
    
    // Implement other generate methods...
}
```

### Handling Attributes with Expressions

```javascript
generateElement(node) {
    let code = `<${node.tag}`;
    
    for (const attr of node.attrs) {
        if (attr.valueNodes && attr.valueNodes.length > 0) {
            // Attribute has expressions
            code += ` ${attr.name}="`;
            for (const valueNode of attr.valueNodes) {
                if (valueNode.type === 'text') {
                    code += valueNode.value;
                } else {
                    // Generate expression evaluation code
                    code += `\${${valueNode.value}}`;
                }
            }
            code += '"';
        } else {
            // Plain attribute
            code += ` ${attr.name}="${attr.value}"`;
        }
    }
    
    code += '>';
    code += this.generateCode(node.children);
    code += `</${node.tag}>`;
    
    return code;
}
```

## Error Handling

All nodes include position information (`pos`) for detailed error reporting:

```javascript
function reportError(node, message) {
    const pos = node.pos;
    throw new Error(
        `${message}\n` +
        `File: ${pos.fileName}\n` +
        `Line: ${pos.startLine}, Column: ${pos.startCol}`
    );
}
```

## Best Practices

1. **Always process in order:**
   ```javascript
   const root = parse(source, fileName);
   root.resolveIncludes(srcPath);    // First
   root.matchSlotsAndContents();     // Second
   // Then traverse and generate code
   ```

2. **Handle missing language attributes:**
   ```javascript
   const condition = node.conditions.find(c => c.name === targetLang);
   if (!condition) {
       throw new Error(
           `No condition for language '${targetLang}' in if statement at ` +
           `${node.pos.fileName}:${node.pos.startLine}`
       );
   }
   ```

3. **Validate node structures:**
   - Check for required attributes
   - Verify parent-child relationships
   - Ensure proper nesting

4. **Use position information:**
   - Include in error messages
   - Generate source maps
   - Help with debugging

## Complete Example

### Input Templates

**layout.html:**
```html
<tempile @doctype></tempile>
<tempile @html lang="en">
<tempile @head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <slot @name="header-extra"></slot>
</tempile>
<tempile @body>
    <slot @name="body-content"></slot>
</tempile>
</tempile>
```

**page.html:**
```html
<include @path="layout.html">
    <content @name="header-extra">
        <title>Home Page</title>
    </content>
    <content @name="body-content">
        <h1>Page Body</h1>
        <if @js="1 === 1">
            if blok
            <elseif @js="1 > 2">
                elseif blok
            </elseif>
            <else>
                else blok
            </else>
        </if>
        <for @js="const item of items">
            <out>item.name</out>
        </for>
    </content>
</include>
```

### Processing

```javascript
import { parse } from 'tempile-core';
import fs from 'fs';

// Parse page.html
const source = fs.readFileSync('page.html', 'utf-8');
const root = parse(source, 'page.html');

// Resolve includes - reads and parses layout.html
root.resolveIncludes('./');

// Match slots with contents - fills header-extra and body-content slots
root.matchSlotsAndContents();

// AST is now ready for compilation
console.log(JSON.stringify(root, null, 2));
```

### Resulting AST Structure

After processing, the AST will have this structure:

```json
{
  "children": [
    {
      "type": "doctype",
      "data": "<!DOCTYPE html>"
    },
    {
      "type": "element",
      "tag": "html",
      "attrs": [{"name": "lang", "value": "en"}],
      "children": [
        {
          "type": "element",
          "tag": "head",
          "children": [
            {"type": "element", "tag": "meta", "attrs": [...]},
            {"type": "element", "tag": "title", "children": [
              {"type": "text", "data": "Home Page"}
            ]}
          ]
        },
        {
          "type": "element",
          "tag": "body",
          "children": [
            {"type": "element", "tag": "h1", "children": [
              {"type": "text", "data": "Page Body"}
            ]},
            {
              "type": "if",
              "conditions": [{"name": "js", "value": "1 === 1"}],
              "ifContent": [
                {"type": "text", "data": "\n\t\t\tif blok\n\t\t\t"}
              ],
              "elseIfNodes": [{
                "type": "elseif",
                "conditions": [{"name": "js", "value": "1 > 2"}],
                "children": [
                  {"type": "text", "data": "\n\t\t\t\telseif blok\n\t\t\t"}
                ]
              }],
              "elseNode": {
                "type": "else",
                "children": [
                  {"type": "text", "data": "\n\t\t\t\telse blok\n\t\t\t"}
                ]
              }
            },
            {
              "type": "for",
              "loops": [{"name": "js", "value": "const item of items"}],
              "children": [
                {"type": "out", "data": "item.name", "isRaw": false}
              ]
            }
          ]
        }
      ]
    }
  ],
  "fileName": "page.html"
}
```

**Key observations:**

1. **Include resolution**: The `<include>` and `<tempile>` tags are unwrapped, their content is merged into the main tree
2. **Slot matching**: `<slot>` tags are replaced with their corresponding `<content>` children
3. **Structure flattening**: The final AST is a clean tree of standard HTML elements and control flow nodes
4. **Position tracking**: Each node includes `pos` with file name and line/column information (omitted above for clarity)

## License

MIT
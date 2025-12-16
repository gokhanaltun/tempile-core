package tempilecore

import (
	"os"
	"path/filepath"
)

type Root struct {
	Childs []Node
}

func (r *Root) ResolveImports(srcPath string) error {
	err := resolveImports(&r.Childs, srcPath)
	if err != nil {
		return err
	}

	return nil
}

func (r *Root) MatchSlotsAndContents() {
	slots := make(map[string]*SlotNode)
	contents := &[]ContentNode{}

	collectSlotsAndContents(slots, contents, &r.Childs)

	for _, c := range *contents {
		if _, ok := slots[c.Name]; ok {
			slots[c.Name].Childs = append(slots[c.Name].Childs, c.Childs...)
		}
	}

	unwrapSlots(&r.Childs)
}

func unwrapSlots(nodes *[]Node) {
	for i := 0; i < len(*nodes); i++ {
		n := (*nodes)[i]

		if n.Type() == NodeSlot {
			slotNode := n.(*SlotNode)
			unwrapSlots(&slotNode.Childs)
			*nodes = append(append((*nodes)[:i], slotNode.Childs...), (*nodes)[i+1:]...)
		} else {
			childs := n.GetChilds()
			if childs != nil {
				unwrapSlots(childs)
			}
		}
	}
}

func collectSlotsAndContents(slotMap map[string]*SlotNode, contentSlice *[]ContentNode, nodes *[]Node) {
	newNode := (*nodes)[:0]
	for _, n := range *nodes {
		if n.Type() == NodeSlot {
			newNode = append(newNode, n)
			slotNode := n.(*SlotNode)
			slotMap[slotNode.Name] = slotNode
		} else if n.Type() == NodeContent {
			contentNode := n.(*ContentNode)
			*contentSlice = append(*contentSlice, *contentNode)
		} else {
			newNode = append(newNode, n)
		}
		childs := n.GetChilds()
		if childs != nil {
			collectSlotsAndContents(slotMap, contentSlice, childs)
		}
	}
	*nodes = newNode
}

func resolveImports(nodes *[]Node, srcPath string) error {
	for i := 0; i < len(*nodes); i++ {
		n := (*nodes)[i]
		if n.Type() == NodeImport {
			importNode := n.(*ImportNode)

			fileByte, err := os.ReadFile(filepath.Join(srcPath, importNode.Path))
			if err != nil {
				return err
			}

			ast, err := Parse(string(fileByte))
			if err != nil {
				return err
			}

			resolveImports(&ast.Childs, srcPath)
			resolveImports(&importNode.Childs, srcPath)

			beforeImport := (*nodes)[:i]
			afterImport := (*nodes)[i+1:]

			ast.Childs = append(ast.Childs, importNode.Childs...)

			*nodes = append(append(beforeImport, ast.Childs...), afterImport...)

			i += len(ast.Childs) - 1
		} else {
			childs := n.GetChilds()
			if childs != nil {
				resolveImports(childs, srcPath)
			}
		}
	}

	return nil
}

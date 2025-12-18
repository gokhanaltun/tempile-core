package tempilecore

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
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
	importNodes := collectImports(&r.Childs)
	slotsMap := make(map[string]map[string]*SlotNode)
	contentsMap := make(map[string]map[string]*ContentNode)

	for _, imp := range importNodes {
		slots, contents := collectSlotsAndContents(&imp.Childs)
		slotsMap[imp.CtxId] = slots
		contentsMap[imp.CtxId] = contents
	}

	for k, v := range contentsMap {
		for innerK, innerV := range v {
			slot, ok := slotsMap[k][innerK]
			if ok {
				slot.Childs = append(slot.Childs, innerV.Childs...)
			}
		}
	}

	unwrapImports(&r.Childs)
	unwrapSlots(&r.Childs)
}

func unwrapImports(nodes *[]Node) {
	for i := 0; i < len(*nodes); i++ {
		n := (*nodes)[i]

		if n.Type() == NodeImport {
			importNode := n.(*ImportNode)
			unwrapImports(&importNode.Childs)
			*nodes = append(append((*nodes)[:i], importNode.Childs...), (*nodes)[i+1:]...)
		} else {
			childs := n.GetChilds()
			if childs != nil {
				unwrapImports(childs)
			}
		}
	}
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

func collectImports(nodes *[]Node) []*ImportNode {
	importNodes := []*ImportNode{}

	for _, n := range *nodes {
		if n.Type() == NodeImport {
			importNode := n.(*ImportNode)
			importNodes = append(importNodes, importNode)
		}
		if childs := n.GetChilds(); childs != nil {
			importNodes = append(importNodes, collectImports(childs)...)
		}
	}

	return importNodes
}

func collectSlotsAndContents(nodes *[]Node) (map[string]*SlotNode, map[string]*ContentNode) {
	slots := make(map[string]*SlotNode)
	contents := make(map[string]*ContentNode)
	newNodes := (*nodes)[:0]

	for _, n := range *nodes {
		if n.Type() == NodeSlot {
			newNodes = append(newNodes, n)
			slotNode := n.(*SlotNode)
			slots[slotNode.Name] = slotNode
		} else if n.Type() == NodeContent {
			contentNode := n.(*ContentNode)
			contents[contentNode.Name] = contentNode
		} else {
			newNodes = append(newNodes, n)
		}

		childs := n.GetChilds()
		if childs != nil {
			s, c := collectSlotsAndContents(childs)
			for sk, sv := range s {
				slots[sk] = sv
			}

			for ck, cv := range c {
				contents[ck] = cv
			}
		}
	}

	*nodes = newNodes
	return slots, contents
}

func resolveImports(nodes *[]Node, srcPath string) error {
	for _, n := range *nodes {
		if n.Type() == NodeImport {
			importNode := n.(*ImportNode)

			pieces := strings.Split(filepath.Join(srcPath, importNode.Path), "/")
			fileName := pieces[len(pieces)-1]

			fileByte, err := os.ReadFile(filepath.Join(srcPath, importNode.Path))
			if err != nil {
				errMessage := fmt.Sprintf("%v \n file: %s line: %d col: %d", err, importNode.Pos.FileName, importNode.Pos.Line, importNode.Pos.Column)
				return errors.New(errMessage)
			}

			ast, err := Parse(string(fileByte), fileName)
			if err != nil {
				return err
			}

			resolveImports(&ast.Childs, srcPath)

			for i := 0; i < len(importNode.Childs); i++ {
				n := importNode.Childs[i]

				if n.Type() != NodeContent {
					importNode.Childs = append(importNode.Childs[:i], importNode.Childs[i+1:]...)
					i = i - 1
				}
			}

			resolveImports(&importNode.Childs, srcPath)

			importNode.Childs = append(ast.Childs, importNode.Childs...)

		} else {
			childs := n.GetChilds()
			if childs != nil {
				resolveImports(childs, srcPath)
			}
		}
	}

	return nil
}

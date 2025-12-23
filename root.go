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

func (r *Root) ResolveIncludes(srcPath string) error {
	err := resolveIncludes(&r.Childs, srcPath)
	if err != nil {
		return err
	}

	return nil
}

func (r *Root) MatchSlotsAndContents() {
	includeNodes := collectIncludes(&r.Childs)
	slotsMap := make(map[string]map[string]*SlotNode)
	contentsMap := make(map[string]map[string]*ContentNode)

	for _, imp := range includeNodes {
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

	unwrapIncludes(&r.Childs)
	unwrapSlots(&r.Childs)
}

func unwrapIncludes(nodes *[]Node) {
	for i := 0; i < len(*nodes); i++ {
		n := (*nodes)[i]

		if n.Type() == NodeInclude {
			includeNode := n.(*IncludeNode)
			unwrapIncludes(&includeNode.Childs)
			*nodes = append(append((*nodes)[:i], includeNode.Childs...), (*nodes)[i+1:]...)
		} else {
			childs := n.GetChilds()
			if childs != nil {
				unwrapIncludes(childs)
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

func collectIncludes(nodes *[]Node) []*IncludeNode {
	includeNodes := []*IncludeNode{}

	for _, n := range *nodes {
		if n.Type() == NodeInclude {
			includeNode := n.(*IncludeNode)
			includeNodes = append(includeNodes, includeNode)
		}
		if childs := n.GetChilds(); childs != nil {
			includeNodes = append(includeNodes, collectIncludes(childs)...)
		}
	}

	return includeNodes
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

func resolveIncludes(nodes *[]Node, srcPath string) error {
	for _, n := range *nodes {
		if n.Type() == NodeInclude {
			includeNode := n.(*IncludeNode)

			pieces := strings.Split(filepath.Join(srcPath, includeNode.Path), "/")
			fileName := pieces[len(pieces)-1]

			fileByte, err := os.ReadFile(filepath.Join(srcPath, includeNode.Path))
			if err != nil {
				errMessage := fmt.Sprintf("%v \n file: %s line: %d col: %d", err, includeNode.Pos.FileName, includeNode.Pos.Line, includeNode.Pos.Column)
				return errors.New(errMessage)
			}

			ast, err := Parse(string(fileByte), fileName)
			if err != nil {
				return err
			}

			resolveIncludes(&ast.Childs, srcPath)

			for i := 0; i < len(includeNode.Childs); i++ {
				n := includeNode.Childs[i]

				if n.Type() != NodeContent {
					includeNode.Childs = append(includeNode.Childs[:i], includeNode.Childs[i+1:]...)
					i = i - 1
				}
			}

			resolveIncludes(&includeNode.Childs, srcPath)

			includeNode.Childs = append(ast.Childs, includeNode.Childs...)

		} else {
			childs := n.GetChilds()
			if childs != nil {
				resolveIncludes(childs, srcPath)
			}
		}
	}

	return nil
}

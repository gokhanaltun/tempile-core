package tempilecore

type ElementNode struct {
	Tag    string
	Attrs  []*Attribute
	Childs []Node
}

func (n *ElementNode) Type() NodeType {
	return NodeElement
}

func (n *ElementNode) GetChilds() *[]Node {
	return &n.Childs
}

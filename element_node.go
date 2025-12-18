package tempilecore

type ElementNode struct {
	Tag    string
	Attrs  []*Attribute
	Childs []Node
	Pos    Pos
}

func (n *ElementNode) Type() NodeType {
	return NodeElement
}

func (n *ElementNode) GetChilds() *[]Node {
	return &n.Childs
}

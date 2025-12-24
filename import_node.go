package tempilecore

type ImportNode struct {
	Attrs []*Attribute
	Pos   Pos
}

func (n *ImportNode) Type() NodeType {
	return NodeImport
}

func (n *ImportNode) GetChilds() *[]Node {
	return nil
}

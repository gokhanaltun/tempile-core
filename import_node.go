package tempilecore

type ImportNode struct {
	Path   string
	Childs []Node
}

func (n *ImportNode) Type() NodeType {
	return NodeImport
}

func (n *ImportNode) GetChilds() *[]Node {
	return &n.Childs
}

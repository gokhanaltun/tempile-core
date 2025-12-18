package tempilecore

type ImportNode struct {
	CtxId  string
	Path   string
	Childs []Node
	Pos    Pos
}

func (n *ImportNode) Type() NodeType {
	return NodeImport
}

func (n *ImportNode) GetChilds() *[]Node {
	return &n.Childs
}

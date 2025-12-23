package tempilecore

type IncludeNode struct {
	CtxId  string
	Path   string
	Childs []Node
	Pos    Pos
}

func (n *IncludeNode) Type() NodeType {
	return NodeInclude
}

func (n *IncludeNode) GetChilds() *[]Node {
	return &n.Childs
}

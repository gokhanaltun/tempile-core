package tempilecore

type CommentNode struct {
	Data string
	Pos  Pos
}

func (n *CommentNode) Type() NodeType {
	return NodeComment
}

func (n *CommentNode) GetChilds() *[]Node {
	return nil
}

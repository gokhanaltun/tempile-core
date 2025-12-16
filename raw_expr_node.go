package tempilecore

type RawExprNode struct {
	Expr string
}

func (n *RawExprNode) Type() NodeType {
	return NodeRawExpr
}

func (n *RawExprNode) GetChilds() *[]Node {
	return nil
}

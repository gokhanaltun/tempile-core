package tempilecore

type ExprNode struct {
	Expr string
}

func (n *ExprNode) Type() NodeType {
	return NodeExpr
}

func (n *ExprNode) GetChilds() *[]Node {
	return nil
}

package tempilecore

type NodeType int

const (
	NodeDocumentType NodeType = iota
	NodeComment
	NodeText
	NodeElement
	NodeIf
	NodeElseIf
	NodeElse
	NodeFor
	NodeInclude
	NodeSlot
	NodeContent
	NodeExpr
	NodeRawExpr
	NodeRawCode
)

type Node interface {
	Type() NodeType
	GetChilds() *[]Node
}

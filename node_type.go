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
	NodeImport
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

import Pos from "../base/Pos.js";
type AttrValueNode = {
    type: "text";
    value: string;
} | {
    type: "expr";
    value: string;
};
type Attribute = {
    name: string;
    value: string;
    valueNodes?: AttrValueNode[];
    pos: Pos;
};
export { Attribute, AttrValueNode };

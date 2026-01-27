interface RelationBody { //Maybe Relation is a distinct type that implements relationbody? Basically: need a way to distinguish a referenced relation from its transcluding its body

}

class Assignable implements RelationBody {
    constructor(types: Resource[], cardinality: Cardinality) {
        this.Types = types;
        this.Cardinality = cardinality;
    }
    Types: Resource[] //May need to handle references by name, esp for extensions. Also references to data fields per resource type.
    Cardinality: Cardinality
}

function assignable(types: Resource[], cardinality: Cardinality): Assignable {
    return new Assignable(types, cardinality);
}

class And implements RelationBody {
    constructor(left: RelationBody, right: RelationBody) {
        this.Left = left
        this.Right = right
    }
    Left: RelationBody
    Right: RelationBody
}

function and(left: RelationBody, right: RelationBody): And {
    return new And(left, right);
}

class Or implements RelationBody {
    constructor(left: RelationBody, right: RelationBody) {
        this.Left = left
        this.Right = right
    }    
    Left: RelationBody
    Right: RelationBody
}

function or(left: RelationBody, right: RelationBody): Or {
    return new Or(left, right);
}

class Unless implements RelationBody {
    constructor(left: RelationBody, right: RelationBody) {
        this.Left = left
        this.Right = right
    }
    Left: RelationBody
    Right: RelationBody
}

function unless(left: RelationBody, right: RelationBody): Unless {
    return new Unless(left, right);
}
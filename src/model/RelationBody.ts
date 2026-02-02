interface RelationBody<T extends Resource> { //Maybe Relation is a distinct type that implements relationbody? Basically: need a way to distinguish a referenced relation from its transcluding its body

}

class SubRelation implements RelationBody<Resource> {
    constructor(rel: Relation<Resource>, sub: Relation<Resource>) {
        this.Rel = rel;
        this.Sub = sub
    }

    Rel: Relation<Resource>
    Sub: Relation<Resource>
}

class Assignable<T extends Resource> implements RelationBody<T> {
    constructor(type: T, cardinality: Cardinality) {
        this.Type = type;
        this.Cardinality = cardinality;
    }
    Type: T
    Cardinality: Cardinality
}

function assignable<T extends Resource>(type: new() => T, cardinality: Cardinality): Assignable<T> {
    const obj : T = get_or_create_singleton(type);
    return new Assignable<T>(obj, cardinality);
}

class And<T extends Resource> implements RelationBody<T> {
    constructor(left: RelationBody<T>, right: RelationBody<T>) {
        this.Left = left
        this.Right = right
    }
    Left: RelationBody<T>
    Right: RelationBody<T>
}

function and<T extends Resource>(left: RelationBody<T>, right: RelationBody<T>): And<T> {
    return new And<T>(left, right);
}

class Or<T extends Resource> implements RelationBody<T> {
    constructor(left: RelationBody<T>, right: RelationBody<T>) {
        this.Left = left
        this.Right = right
    }    
    Left: RelationBody<T>
    Right: RelationBody<T>
}

function or<T extends Resource>(left: RelationBody<T>, right: RelationBody<T>): Or<T> {
    return new Or<T>(left, right);
}

class Unless<T extends Resource> implements RelationBody<T> {
    constructor(left: RelationBody<T>, right: RelationBody<T>) {
        this.Left = left
        this.Right = right
    }
    Left: RelationBody<T>
    Right: RelationBody<T>
}

function unless<T extends Resource>(left: RelationBody<T>, right: RelationBody<T>): Unless<T> {
    return new Unless<T>(left, right);
}
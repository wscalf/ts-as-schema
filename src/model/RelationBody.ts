interface RelationBody<T extends Resource> { //Maybe Relation is a distinct type that implements relationbody? Basically: need a way to distinguish a referenced relation from its transcluding its body
    Visit(visitor: SchemaVisitor): any;
}

class SubRelation implements RelationBody<Resource> {
    constructor(rel: Relation<Resource>, sub: Relation<Resource>) {
        this.Rel = rel;
        this.Sub = sub
    }

    Rel: Relation<Resource>
    Sub: Relation<Resource>

    public Visit(visitor: SchemaVisitor): any {
        return visitor.VisitSubRelationExpression(this.Rel.get_name(), this.Sub.get_name());
    }
}

class Assignable<T extends Resource> implements RelationBody<T> {
    constructor(type: T, cardinality: Cardinality) {
        this.Type = type;
        this.Cardinality = cardinality;
    }
    Type: T
    Cardinality: Cardinality

    public Visit(visitor: SchemaVisitor): any {
        return visitor.VisitAssignableExpression(this.Type.Name, Cardinality[this.Cardinality]);
    }
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

    public Visit(visitor: SchemaVisitor): any {
        const left = this.Left.Visit(visitor);
        const right = this.Right.Visit(visitor);

        return visitor.VisitAnd(left, right);
    }
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

    public Visit(visitor: SchemaVisitor): any {
        const left = this.Left.Visit(visitor);
        const right = this.Right.Visit(visitor);

        return visitor.VisitOr(left, right);
    }
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

        public Visit(visitor: SchemaVisitor): any {
        const left = this.Left.Visit(visitor);
        const right = this.Right.Visit(visitor);

        return visitor.VisitUnless(left, right);
    }
}

function unless<T extends Resource>(left: RelationBody<T>, right: RelationBody<T>): Unless<T> {
    return new Unless<T>(left, right);
}
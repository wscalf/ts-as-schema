interface RelationBody<T extends Resource> { //Maybe Relation is a distinct type that implements relationbody? Basically: need a way to distinguish a referenced relation from its transcluding its body
    Visit(visitor: SchemaVisitor): any;
}

class SubRelation implements RelationBody<Resource> {
    constructor(rel: Relation<Resource>, sub_accessor: () => Relation<Resource>) {
        this.Rel = rel;
        this.SubAccessor = sub_accessor;
    }

    Rel: Relation<Resource>
    private SubAccessor: () => Relation<Resource>

    public Visit(visitor: SchemaVisitor): any {
        const sub = this.SubAccessor();
        return visitor.VisitSubRelationExpression(this.Rel.get_name(), sub.get_name());
    }
}

class Assignable<T extends Resource> implements RelationBody<T> {
    constructor(type: new() => T, cardinality: Cardinality, dataType: DataType) {
        this.Type = type;
        this.Cardinality = cardinality;
        this.DataType = dataType;
    }
    Type: new() => T
    Cardinality: Cardinality
    DataType: DataType

    public Visit(visitor: SchemaVisitor): any {
        const obj = get_or_create_singleton(this.Type);
        return visitor.VisitAssignableExpression(obj.Namespace, obj.Name, Cardinality[this.Cardinality], this.DataType.visit(visitor));
    }
}

function assignable<T extends Resource>(cardinality: Cardinality, type: new() => T, dataType: DataType): Assignable<T> {
    return new Assignable<T>(type, cardinality, dataType);
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
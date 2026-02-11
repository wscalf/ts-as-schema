abstract class DataType {
    abstract visit(visitor: SchemaVisitor): any
    or(other: DataType): DataTypeUnion {
        return new DataTypeUnion(this, other);
    }
}

class DataTypeUnion extends DataType {
    left: DataType
    right: DataType

    constructor(left: DataType, right: DataType) {
        super();

        this.left = left;
        this.right = right
    }

    override visit(visitor: SchemaVisitor) {
        return visitor.VisitCompositeDataType([this.left.visit(visitor), this.right.visit(visitor)]);
    }
}

class NumericID extends DataType {
    min: number | null
    max: number | null

    constructor(min: number | null, max: number | null) {
        super();

        this.min = min;
        this.max = max;
    }

    override visit(visitor: SchemaVisitor) {
        return visitor.VisitNumericIDDataType(this.min, this.max);
    }
}

class Textual extends DataType {
    minLength: number | null
    maxLength: number | null
    regex: string | null

    constructor(minLength: number | null, maxLength: number | null, regex: string | null) {
        super();

        this.minLength = minLength;
        this.maxLength = maxLength;
        this.regex = regex;
    }

    override visit(visitor: SchemaVisitor) {
        return visitor.VisitTextDataType(this.minLength, this.maxLength, this.regex);
    }
}

class UUID extends DataType {
    constructor() {
        super();
    }

    override visit(visitor: SchemaVisitor) {
        return visitor.VisitUUIDDataType();
    }
}

function uuid(): UUID {
    return new UUID();
}

function text({minLength = null, maxLength = null, regex = null}: {minLength?: number | null, maxLength?: number | null, regex?: string | null} = {}): Textual {
    return new Textual(minLength, maxLength, regex);
}

function numeric_id({min = null, max = null}: {min?: number | null, max?: number | null} = {}): NumericID {
    return new NumericID(min, max);
}

function all(ctor: new() => Resource): Textual {
    const instance = get_or_create_singleton(ctor);
    
    const expr = `${instance.Namespace}/${instance.Name}:\\*` //SpiceDB-specific formatting
    return text({regex: expr});
}
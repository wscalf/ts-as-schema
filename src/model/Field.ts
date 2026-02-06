class Field {
    required: boolean
    dataType: DataType

    constructor(required: boolean, dataType: DataType) {
        this.required = required;
        this.dataType = dataType;
    }

    visit(name: string, visitor: SchemaVisitor): any {
        visitor.BeginDataField(name);
        return visitor.VisitDataField(name, this.required, this.dataType.visit(visitor));
    }
}
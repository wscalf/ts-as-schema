class Native {

}

interface SchemaVisitor {
    // Construct relation body expressions
    VisitAnd(left: any, right: any): any
    VisitOr(left: any, right: any): any
    VisitUnless(left: any, right: any): any
    VisitRelationExpression(name: string): any
    VisitSubRelationExpression(name: string, sub: string): any
    VisitAssignableExpression(typeNamespace: string, typeName: string, cardinality: string, dataType: any): any

    BeginRelation(name: string): void
    // Construct relation expression
    VisitRelation(name: string, body: any): any

    BeginType(namespace: string, name: string): void
    // Construct type expression
    VisitType(namespace: string, name: string, relations: any[], dataFields: any[]): any

    VisitDataField(name: string, required: boolean, type: any): any
    
    VisitCompositeDataType(types: any[]): any //Note sure name and namespace matter here, actually
    VisitUUIDDataType(): any
    VisitNumericIDDataType(min: number | null, max: number | null): any
    VisitTextDataType(minLength: number | null, maxLength: number | null, regex: string | null): any
}

declare function log(...args: any[]): void;
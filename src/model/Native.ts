class Native {

}

interface SchemaVisitor {
    // Construct relation body expressions
    VisitAnd(left: any, right: any): any
    VisitOr(left: any, right: any): any
    VisitUnless(left: any, right: any): any
    VisitRelationExpression(name: string): any
    VisitSubRelationExpression(name: string, sub: string): any
    VisitAssignableExpression(typeNamespace: string | null, typeName: string, cardinality: string): any

    BeginRelation(name: string): void
    // Construct relation expression
    VisitRelation(name: string, body: any): any

    BeginType(namespace: string, name: string): void
    // Construct type expression
    VisitType(namespace: string, name: string, relations: any[]): any
}

declare function log(...args: any[]): void;
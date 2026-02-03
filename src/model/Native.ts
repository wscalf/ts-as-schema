class Native {

}

interface SchemaVisitor {
    // Construct relation body expressions
    VisitAnd(left: any, right: any): any
    VisitOr(left: any, right: any): any
    VisitUnless(left: any, right: any): any
    VisitRelationExpression(name: string): any
    VisitSubRelationExpression(name: string, sub: string): any
    VisitAssignableExpression(typeName: string, cardinality: string): any

    // Construct relation expression
    VisitRelation(name: string, body: any): any

    // Construct type expression
    VisitType(name: string, relations: any[]): any
}
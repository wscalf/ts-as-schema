class Relation<T extends Resource> implements RelationBody<T> {
    constructor(body_factory: () => RelationBody<T>) {
        this.name = null;
        this.resource = null;
        this.body_factory = body_factory;
        this.body = null
    }

    sub(accessor: (resource: T) => Relation<Resource>): RelationBody<Resource> {
        if (this.resource == null) {
            throw new Error(`no resource attached to relation named ${this.name} - was it finalized?`);
        }
        const sub = accessor(this.resource);
        return new SubRelation(this, sub);
    }
    
    finalize(resource: T, propertyName: string) {
        this.resource = resource;
        this.name = propertyName;
    }

    private resource: T | null; //Backreference to owning resource type, will be populated by finalizer
    private body_factory: () => RelationBody<T>;
    private body: RelationBody<T> | null
    
    private name: string | null;
    public get_name(): string {
        if (this.name == null) {
            throw new Error(`No name found on a relation in type ${this.resource?.Name}`);
        }

        return this.name;
    }
    public get_body(): RelationBody<T> {
        if (this.body === null) {
            this.body = this.body_factory();
        }

        return this.body;
    }

    public VisitRelation(visitor: SchemaVisitor): any {
        visitor.BeginRelation(this.get_name());
        const body = this.get_body().Visit(visitor);
        return visitor.VisitRelation(this.get_name(), body);
    }

    public Visit(visitor: SchemaVisitor): any { //Problem- relations impl RelationBody<T> so they can be used as references, but they're also visitable as schema, and this doesn't distinguish, leading to relation bodies showing up where the references belong
        return visitor.VisitRelationExpression(this.get_name());
    }
}
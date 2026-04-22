type RelationMutator<T extends Resource> = (body: RelationBody<T>) => RelationBody<T>;

class Relation<T extends Resource> implements RelationBody<T> {
    constructor(body: RelationBody<T>) {
        this.name = null;
        this.resource = null;
        this.body = body;
    }

    sub(accessor: (resource: T) => Relation<Resource>): RelationBody<Resource> {
        return new SubRelation(this, () => {
            if (this.resource == null) {
                throw new Error(`no resource attached to relation named ${this.name} - was it finalized?`);
            }
            return accessor(this.resource);
        });
    }
    
    finalize(resource: T, propertyName: string) {
        log("finalizing", resource.Name, propertyName);
        this.resource = resource;
        this.name = propertyName;
        log("finalized", resource.Name, propertyName);
    }

    private resource: T | null; //Backreference to owning resource type, will be populated by finalizer
    private body: RelationBody<T>
    
    private name: string | null;
    public get_name(): string {
        if (this.name == null) {
            throw new Error(`No name found on a relation in type ${this.resource?.Name}`);
        }

        return this.name;
    }
    
    public replace_body(mutator: RelationMutator<T>): void {
        this.body = mutator(this.body);
    }
    
    public VisitRelation(visitor: SchemaVisitor): any {
        log("visiting relation", this.get_name());
        visitor.BeginRelation(this.get_name());
        const body = this.body.Visit(visitor);
        log("visited relation", this.get_name());
        return visitor.VisitRelation(this.get_name(), body);
    }
    
    public Visit(visitor: SchemaVisitor): any { //Problem- relations impl RelationBody<T> so they can be used as references, but they're also visitable as schema, and this doesn't distinguish, leading to relation bodies showing up where the references belong
        return visitor.VisitRelationExpression(this.get_name());
    }
}

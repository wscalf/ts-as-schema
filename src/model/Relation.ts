class Relation<T extends Resource> implements RelationBody<T> {
    constructor(body_factory: () => RelationBody<T>) {
        this.name = null;
        this.resource = null;
        this.body_factory = body_factory;
        this.body = null
    }

    sub(accessor: (resource: T) => Relation<Resource>): RelationBody<Resource> {
        const sub = accessor(this.resource as T);
        return new SubRelation(this, sub);
    }
    
    finalize(resource: Resource, propertyName: string) {
        this.resource = resource;
        this.name = propertyName;
    }

    private resource: Resource | null; //Backreference to owning resource type, will be populated by finalizer
    private body_factory: () => RelationBody<T>;
    private body: RelationBody<T> | null
    
    public name: string | null;
    public get_body(): RelationBody<T> {
        if (this.body === null) {
            this.body = this.body_factory();
        }

        return this.body;
    }
}
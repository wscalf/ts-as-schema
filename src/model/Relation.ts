class Relation<T extends Resource> implements RelationBody<T> {
    constructor(body_factory: () => RelationBody<T>) {
        this.name = null;
        this.resource = null;
        this.body_factory = body_factory;
        this.body = null
    }

    sub<U extends Resource>(accessor: (resource: T) => Relation<U>): RelationBody<U> {
        return accessor(this.resource as T).get_body(); //Actually, this should be a descriptor we can convert into a subrelation expression. Also, it needs this.resource to be populated (by finalizer)
        //And, in order to wait for that, all relation body evaluation needs to be deferred.
    }
    
    private resource: Resource | null; //Backreference to owning resource type, will be populated by finalizer
    private body_factory: () => RelationBody<T>; //The body should probably be deferred so it can pick up extension properties
    private body: RelationBody<T> | null
    
    public name: string | null;
    public get_body(): RelationBody<T> {
        if (this.body === null) {
            this.body = this.body_factory();
        }

        return this.body;
    }
}
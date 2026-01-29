class Relation<T extends Resource> implements RelationBody<T> {
    constructor(body: RelationBody<T>) {
        this.name = null;
        this.resource = null;
        this.body = body;
    }

    sub<U extends Resource>(accessor: (resource: T) => Relation<U>): RelationBody<U> {
        return accessor(this.resource as T).body; //Actually, this should be a descriptor we can convert into a subrelation expression
    }
    name: string | null;
    resource: Resource | null; //Backreference to owning resource type
    body: RelationBody<T>; //The body should probably be deferred so it can pick up extension properties
}
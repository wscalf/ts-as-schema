class Relation implements RelationBody {
    constructor(body: RelationBody) {
        this.name = null;
        this.resource = null;
        this.body = body;
    }
    name: string | null;
    resource: Resource | null; //Backreference to owning resource type
    body: RelationBody;
}
class Principal extends Resource {}

class Role extends Resource {
    static any_any_any: Relation = new Relation(assignable([Principal], Cardinality.All));
}

class Workspace extends Resource {
    static parent: Relation = new Relation(assignable([Workspace], Cardinality.ExactlyOne));
    //Okay, here's a potential problem: in KSL, you can do parent.Relation, but to do that here parent needs to be of type Workspace. Which it kind of is. But not to TS's type system.
    // One option is to make Relation generic over the resource type. This may even help ensure correctness, but we actually kind of want duck-type behavior. I think.
}
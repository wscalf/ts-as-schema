interface RelationBody {
}
declare class Assignable implements RelationBody {
    Types: Resource[];
    Cardinality: Cardinality;
}
declare class And implements RelationBody {
    constructor(left: RelationBody, right: RelationBody);
    Left: RelationBody;
    Right: RelationBody;
}
declare function and(left: RelationBody, right: RelationBody): And;
declare class Or implements RelationBody {
    constructor(left: RelationBody, right: RelationBody);
    Left: RelationBody;
    Right: RelationBody;
}
declare function or(left: RelationBody, right: RelationBody): Or;
declare class Unless implements RelationBody {
    constructor(left: RelationBody, right: RelationBody);
    Left: RelationBody;
    Right: RelationBody;
}
declare function unless(left: RelationBody, right: RelationBody): Unless;

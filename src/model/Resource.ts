class Resource {
  constructor() {
    this.Name = "";
  }

  visit(visitor: SchemaVisitor): any {
    const name = this.Name;
    let relations: any[] = [];

    const props = Object.getOwnPropertyNames(this)
    for (const name of props) {
      const v = (this as any)[name];
      if (v instanceof Relation) {
        relations.push(v.VisitRelation(visitor));
      }
    }

    return visitor.VisitType(name, relations);
  }

  applyExtensions() {}

  finalizeRelations<T extends Resource>(this: T) {
    const props = Object.getOwnPropertyNames(this)
    for (const name of props) {
      const v = (this as any)[name];
      if (v instanceof Relation) {
        v.finalize(this, name);
      }
    }
  }

  Name: string
  finalize(name: string): void {
    this.Name = name;
    this.finalizeRelations();
  }
}

function get_or_create_singleton<T extends Resource>(ctor: new() => T): T {
  const key = "__instance__"
  const obj = ctor as any;
  if (!obj.prototype.hasOwnProperty.call(obj, key)) {
    Object.defineProperty(obj, key, {
      value: new ctor(),
      enumerable: false,
      writable: false,
    });
  }

  return obj.__instance__;
}

function finalize_all_resource_types() {
  const globals = globalThis as Record<string, any>;

  for (const key of Object.keys(globals)) {
    const v = globals[key]

    if (typeof v !== "function") continue;
    if (!("prototype" in v)) continue;

    const ctor = v as Function & { prototype?: any };

    if (!ctor.prototype) continue;
    if (ctor === Resource) continue;

    if (ctor.prototype instanceof Resource) {
      //Found a type that extends resource!
      const instance = get_or_create_singleton(ctor as new() => Resource);
      instance.applyExtensions();
    }
  }

  for (const key of Object.keys(globals)) {
    const v = globals[key]

    if (typeof v !== "function") continue;
    if (!("prototype" in v)) continue;

    const ctor = v as Function & { prototype?: any };

    if (!ctor.prototype) continue;
    if (ctor === Resource) continue;

    if (ctor.prototype instanceof Resource) {
      //Found a type that extends resource!
      const instance = get_or_create_singleton(ctor as new() => Resource);
      instance.finalize(key);
    }
  }
}

function visit_all_resource_types(visitor: SchemaVisitor) {
  const globals = globalThis as Record<string, any>;
  for (const key of Object.keys(globals)) {
    const v = globals[key]

    if (typeof v !== "function") continue;
    if (!("prototype" in v)) continue;

    const ctor = v as Function & { prototype?: any };

    if (!ctor.prototype) continue;
    if (ctor === Resource) continue;

    if (ctor.prototype instanceof Resource) {
      //Found a type that extends resource!
      const instance = get_or_create_singleton(ctor as new() => Resource);
      instance.visit(visitor);
    }
  }
}

function get_or_add_relation<T extends Resource>(ctor: new() => T, name: string, rel_factory: () => Relation<T>): Relation<T> {
  let obj = (get_or_create_singleton(ctor) as any);
  if (obj[name] === undefined) {
    obj[name] = rel_factory();
  }

  return obj[name];
}

function add_relation<T extends Resource>(ctor: new() => T, name: string, relation: Relation<T>) {
  let obj = (get_or_create_singleton(ctor) as any);

  obj[name] = relation;
}

function get_relation<T extends Resource>(ctor: new() => T, name: string): Relation<T> {
   let obj = (get_or_create_singleton(ctor) as any);

   return obj[name];
}
class Resource {
  constructor() {
    this.Name = "";
    this.Namespace = "";
  }

  visit(visitor: SchemaVisitor): any {
    const name = this.Name;
    const ns = this.Namespace;
    let relations: any[] = [];

    visitor.BeginType(ns, name);
    const props = Object.getOwnPropertyNames(this)
    for (const name of props) {
      const v = (this as any)[name];
      if (v instanceof Relation) {
        relations.push(v.VisitRelation(visitor));
      }
    }

    return visitor.VisitType(ns, name, relations);
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
  Namespace: string
  finalize(namespace: string, name: string): void {
    this.Namespace = namespace;
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

  _apply_to_all_resource_types((ns, typeName, instance) => {
    instance.applyExtensions();
  })

  _apply_to_all_resource_types((ns, typeName, instance) => {
    instance.finalize(ns, typeName);
  })
}

const __ksl_explicit_types = "__ksl_explicit_types";

function resource_type_for_namespace(ns: any) {
  return (name: string) => {
    return (ctor: typeof Resource) => {
      if (ns[__ksl_explicit_types] == undefined) {
        ns[__ksl_explicit_types] = {};
      }
      let explicit_types = ns[__ksl_explicit_types];

      explicit_types[name] = ctor;
    }
  }
}

function _apply_to_all_resource_types(operation: (ns: string, typeName: string, resource: Resource) => void): void {
  const globals = globalThis as Record<string, any>;
  let visited_types = new Set();

  for (const ns_name of Object.keys(globals)) {
    const ns = globals[ns_name]

    const explicit_types = ns[__ksl_explicit_types];
    if (explicit_types != undefined) {
      for (const key of Object.keys(explicit_types)) {
        const ctor = explicit_types[key];
        const instance = get_or_create_singleton(ctor as new() => Resource);
        operation(ns_name, key, instance);
        visited_types.add(ctor);
      }
    }
    
    for (const key of Object.keys(ns)) {
      const v = ns[key];

      if (typeof v !== "function") continue;
      if (!("prototype" in v)) continue;

      const ctor = v as Function & { prototype?: any };

      if (!ctor.prototype) continue;
      if (ctor === Resource) continue;

      if (ctor.prototype instanceof Resource) {
        //Found a type that extends resource!
        if (visited_types.has(ctor)) continue; //Already visited
        const instance = get_or_create_singleton(ctor as new() => Resource);
        operation(ns_name, key, instance);
        visited_types.add(ctor);
      }
    }


  }
}

class Set {
  private values: any[] = [];

  has(v: any) {return this.values.indexOf(v) > -1;}
  add(v: any) {
    if (!this.has(v)) {
      this.values.push(v);
    }
  }
}

function visit_all_resource_types(visitor: SchemaVisitor) {
  _apply_to_all_resource_types((ns, typeName, instance) => {
    instance.visit(visitor);
  })
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
  if (obj[name] != undefined) {
    throw new Error(`Duplicate relation: ${name}`); //This function runs during extension time, not sure if we can actually get the type name here
  }

  obj[name] = relation;
}

function get_relation<T extends Resource>(ctor: new() => T, name: string): Relation<T> {
   let obj = (get_or_create_singleton(ctor) as any);

   return obj[name];
}
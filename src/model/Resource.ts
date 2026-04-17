class Resource {
  constructor() {
    this.Name = "";
    this.Namespace = "";
  }

  visit(visitor: SchemaVisitor): any {
    log("visiting", this.Name, this.Namespace);
    const name = this.Name;
    const ns = this.Namespace;
    let relations: any[] = [];
    let fields: any[] = [];

    visitor.BeginType(ns, name);
    const props = Object.getOwnPropertyNames(this)
    for (const name of props) {
      log("visiting property", name);
      const v = (this as any)[name];
      if (v instanceof Relation) {
        relations.push(v.VisitRelation(visitor));
      }
      else if (v instanceof Field) {
        fields.push(v.visit(name, visitor));
      }
    }

    log("visited", this.Name, this.Namespace);
    return visitor.VisitType(ns, name, relations, fields);
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
    log("finalizing", namespace, name);
    this.Namespace = namespace;
    this.Name = name;
    this.finalizeRelations();
    log("finalized", namespace, name);
  }
}

function get_or_create_singleton<T extends Resource>(ctor: new() => T): T {
  const key = "__instance__"
  const obj = ctor as any;
  if (!obj.prototype.hasOwnProperty.call(obj, key)) {
    log("creating singleton: ", obj.name);
    Object.defineProperty(obj, key, {
      value: new ctor(),
      enumerable: false,
      writable: false,
    });
  }

  return obj.__instance__;
}

let _namespace_extensions: (() => void)[] = []
function register_extension_invocation(invocation: () => void): void {
  _namespace_extensions.push(invocation);
}

let _v1_permissions: Record<string, Record<string, {verb: string}[]>> = {};

function register_v1_permission(application: string, resource: string, verb: string): void {
  if (!_v1_permissions[application]) {
    _v1_permissions[application] = {};
  }
  const app = _v1_permissions[application];
  _add_v1_permission(app, resource, verb);
  _add_v1_permission(app, resource, "*");
  _add_v1_permission(app, "*", verb);
  _add_v1_permission(app, "*", "*");
}

function _add_v1_permission(app: Record<string, {verb: string}[]>, resource: string, verb: string): void {
  if (!app[resource]) {
    app[resource] = [];
  }
  for (let i = 0; i < app[resource].length; i++) {
    if (app[resource][i].verb === verb) return;
  }
  app[resource].push({verb: verb});
}

function get_v1_permissions(): Record<string, Record<string, {verb: string}[]>> {
  return _v1_permissions;
}

function initialize_resource_types_in_module(namespace: string, module: any) {
  const exports = module;
  const keys = Object.keys(exports);
  log("initializing module", namespace);
  _apply_to_all_resource_types(module, (typeName, instance) => {
    
  })
  log("initialized module", namespace);
}

function finalize_resource_types_in_module(namespace: string, module: any) {
  const exports = module;
  const keys = Object.keys(exports);
  log("finalizing module", namespace);
  _apply_to_all_resource_types(module, (typeName, instance) => {
    instance.finalize(namespace, typeName);
  })
  log("finalized module", namespace);
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

function _apply_to_all_namespaces(operation: (ns: any) => void): void {
  const globals = globalThis as Record<string, any>;
  for (const ns_name of Object.keys(globals)) {
    const ns = globals[ns_name];
    operation(ns);
  }
}

function _apply_to_all_resource_types(module: any, operation: (typeName: string, resource: Resource) => void): void {
  const globals = globalThis as Record<string, any>;
  let visited_types = new CtorSet();

  const explicit_types = module[__ksl_explicit_types];
  if (explicit_types != undefined) {
    for (const key of Object.keys(explicit_types)) {
      const ctor = explicit_types[key];
      const instance = get_or_create_singleton(ctor as new() => Resource);
      operation(key, instance);
      visited_types.add(ctor);
    }
  }
  
  for (const key of Object.keys(module)) {
    const v = module[key];

    if (typeof v !== "function") continue;
    if (!("prototype" in v)) continue;

    const ctor = v as Function & { prototype?: any };

    if (!ctor.prototype) continue;
    if (ctor === Resource) continue;

    if (ctor.prototype instanceof Resource) {
      //Found a type that extends resource!
      if (visited_types.has(ctor)) continue; //Already visited
      const instance = get_or_create_singleton(ctor as new() => Resource);
      operation(key, instance);
      visited_types.add(ctor);
    }
  }
}


class CtorSet {
  private values: any[] = [];

  has(v: any) {return this.values.indexOf(v) > -1;}
  add(v: any) {
    if (!this.has(v)) {
      this.values.push(v);
    }
  }
}


// This needs to take a value to visit that's the 'exports' from a module
function visit_resource_types_in_module(module: any, visitor: SchemaVisitor) {
  _apply_to_all_resource_types(module, (typeName, instance) => {
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

function get_relation<T extends Resource>(ctor: new() => Resource, name: string): Relation<T> {
   let obj = (get_or_create_singleton(ctor) as any);

   return obj[name];
}
class Resource {
  constructor() {
    this.Name = "";
  }

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
      instance.finalize(key);
    }
  }
}
class Resource {
    static $<T extends typeof Resource>(this: T): InstanceType<T> {
        const ctor = this as any;
        if (!ctor.__instance__) {
          Object.defineProperty(ctor, "__instance__", {
            value: new ctor(),
            enumerable: false,
            writable: false,
          });
        }

        return ctor.__instance__;
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
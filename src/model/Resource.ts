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
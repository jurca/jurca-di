
import DependencyInjector from "../es6/DependencyInjector"

describe("DependencyInjector", () => {

  let di

  beforeEach(() => {
    di = new DependencyInjector()
  })

  describe("get", () => {
    it("should return a shared instance of a class", () => {
      class Implementation {}

      di.configure(Implementation, 0)

      expect(di.get(Implementation) instanceof Implementation).toBeTruthy()
      expect(di.get(Implementation)).toBe(di.get(Implementation))
    })

    it("should return a shared instance of an interface", () => {
      class Interface {}
      class Implementation extends Interface {}

      di.configure(Implementation, 0)
      di.setImplementation(Interface, Implementation)

      expect(di.get(Interface) instanceof Interface).toBeTruthy()
      expect(di.get(Interface) instanceof Implementation).toBeTruthy()
      expect(di.get(Interface)).toBe(di.get(Interface))
    })
  })

  describe("create", () => {
    it("should create a new instance of a class", () => {
      class Implementation {}

      di.configure(Implementation, 0)

      expect(di.create(Implementation) instanceof Implementation).toBeTruthy()
      expect(di.create(Implementation) instanceof Implementation).toBeTruthy()
    })

    it("should create a new instance of an interface", () => {
      class Interface {}
      class Implementation extends Interface {}

      di.configure(Implementation, 0)
      di.setImplementation(Interface, Implementation)
      expect(di.create(Interface) instanceof Interface).toBeTruthy()
      expect(di.create(Interface) instanceof Implementation).toBeTruthy()
      expect(di.create(Interface)).not.toBe(di.create(Interface))
    })

    it("allows specifying dependencies", () => {
      let firstArg, secondArg

      class Dependency {}
      class Implementation {
        constructor(first, second) {
          firstArg = first
          secondArg = second
        }
      }

      di.configure(Dependency, 0)

      let instance = di.create(Implementation, Dependency, "foo")
      expect(instance instanceof Implementation).toBeTruthy()
      expect(firstArg instanceof Dependency).toBeTruthy()
      expect(secondArg).toBe("foo")
    })

    it("should prefer specified dependencies over configured ones", () => {
      var passedArg

      class Implemtation {
        constructor(arg) {
          passedArg = arg
        }
      }

      di.configure(Implemtation, 1)
      di.create(Implemtation, 2)

      expect(passedArg).toBe(2)
    })

    it("should use default dependencies if they are specified", () => {
      var passedArg

      class Implementation {
        constructor(arg) {
          passedArg = arg
        }

        static get dependencies() {
          return ["foo"]
        }
      }

      di.create(Implementation)

      expect(passedArg).toBe("foo")
    })

    it("should prefer configured dependencies over default", () => {
      var passedArg

      class Implementation {
        constructor(arg) {
          passedArg = arg
        }

        static get dependencies() {
          return ["foo"]
        }
      }

      di.configure(Implementation, "bar")
      di.create(Implementation)

      expect(passedArg).toBe("bar")
    })
  })

  describe("configure", () => {
    it("should reject changing dependency configuration for configured " +
        "classes", () => {
      class Implementation {}

      di.configure(Implementation)
      expect(() => {
        di.configure(Implementation)
      }).toThrow()
    })

    it("should reject specifying dependencies for a class registered as an " +
        "interface", () => {
      class Interface {}
      class Implementation {}

      di.setImplementation(Interface, Implementation)

      expect(() => {
        di.configure(Interface)
      }).toThrow()
    })

    it("cannot be used to reconfigure instantiated class", () => {
      class Implementation {}

      di.create(Implementation, 1)

      expect(() => {
        di.configure(Implementation, 2)
      }).toThrow()
    })

    it("overrides the default dependencies", () => {
      let passedArg

      class Implementation {
        constructor(arg) {
          passedArg = arg
        }

        static get dependencies() {
          return [1]
        }
      }

      di.configure(Implementation, 2)
      di.get(Implementation)

      expect(passedArg).toBe(2)
    })
  })

  describe("setImplementation", () => {
    class Interface1 {}
    class Interface2 {}
    class Implementation {}

    it("should not allow reconfiguring implementation", () => {
      di.setImplementation(Interface1, Implementation)

      class Impl2 {}

      expect(() => {
        di.setImplementation(Interface1, Impl2)
      }).toThrow()
    })

    it("should not allow using configured class as interface", () => {
      di.configure(Implementation)

      expect(() => {
        di.setImplementation(Implementation, Interface1)
      }).toThrow()
    })

    it("should configure the implementation of a interface", () => {
      di.setImplementation(Interface1, Implementation)
      di.configure(Implementation, 1)
      expect(di.get(Interface1) instanceof Implementation).toBeTruthy()
    })

    it("should allow implementing interface using another interface", () => {
      di.setImplementation(Interface1, Interface2)
      di.setImplementation(Interface2, Implementation)
      di.configure(Implementation, 1)
      expect(di.get(Interface1) instanceof Implementation).toBeTruthy()
    })
  })

  describe("clear", () => {
    it("should clear the cache of shared instances", () => {
      class Implementation {}
      di.configure(Implementation, 1)

      let instance = di.get(Implementation)
      di.clear()
      expect(di.get(Implementation)).not.toBe(instance)
    })
  })

  it("should allow configuring the \"default dependencies\" property name",
      () => {
    expect(di.dependenciesPropertyName).toBe("dependencies")

    let passedArg
    class Implementation {
      constructor(arg) {
        passedArg = arg
      }

      static get customPropName() {
        return [1]
      }
    }

    di.dependenciesPropertyName = "customPropName"
    expect(di.dependenciesPropertyName).toBe("customPropName")
    di.get(Implementation)

    expect(passedArg).toBe(1)
  })

  it("must not allow changing the \"default dependencies\" property name " +
      "repeatedly", () => {
    di.dependenciesPropertyName = "foo"

    expect(() => {
      di.dependenciesPropertyName = "bar"
    }).toThrow()
  })

  it("should allow chaning the \"default dependencies\" property name to " +
      "its current value", () => {
    di.dependenciesPropertyName = "dependencies"
    di.dependenciesPropertyName = "dependencies"
    di.dependenciesPropertyName = "dependencies"
    di.dependenciesPropertyName = "dependencies"
  })

  it("must not allow changing the \"default dependencies\" property name " +
      "after being used to create instances", () => {
    class Implementation {}
    di.configure(Implementation, 1)

    di.get(Implementation)

    expect(() => {
      di.dependenciesPropertyName = "foo"
    }).toThrow()
  })

})

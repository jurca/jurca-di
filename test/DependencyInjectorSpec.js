
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

  it("should reject changing dependency configuration for configured classes",
      () => {
    class Implementation {}

    di.configure(Implementation)
    expect(() => {
      di.configure(Implementation)
    }).toThrow()
  })

})


/**
 * The default name of the getter/property this dependency injector uses to
 * retrieve the default dependencies of a class.
 *
 * @type {string}
 */
const DEFAULT_DEPENDENCY_GETTER_NAME = "dependencies"

/**
 * Private fields and methods.
 */
const PRIVATE  = Object.freeze({
  // fields
  dependenciesGetterName: Symbol("dependenciesGetterName"),
  dependenciesGetterNameChanged: Symbol("dependenciesGetterNameChanged"),
  dependencies: Symbol("dependencies"),
  implementations: Symbol("implementations"),
  instances: Symbol("instance"),
  instantiatedClasses: Symbol("instantiatedClasses"),

  // method
  getImplementation: Symbol("getImplementation")
})

/**
 * Dependency injector with support for interfaces, both default and custom
 * dependencies and dependencies specified by classes.
 */
export default class DependencyInjector {
  /**
   * Initializes the dependency injector.
   */
  constructor() {
    /**
     * The name of the getter/property this dependency injector uses to
     * retrieve the default dependencies of a class.
     *
     * @type {string}
     */
    this[PRIVATE.dependenciesGetterName] = DEFAULT_DEPENDENCY_GETTER_NAME

    /**
     * Flag signalling whether the name of the getter/property this dependency
     * injector uses to retrieve the default dependencies of a class has been
     * changed.
     *
     * @type {boolean}
     */
    this[PRIVATE.dependenciesGetterNameChanged] = false

    /**
     * Storage of custom default dependencies for classes.
     *
     * @type {Map<function(new: Object, ...*), (function(new: Object, ...*)|*)[]>}
     */
    this[PRIVATE.dependencies] = new Map()

    /**
     * Map of interfaces to the classes (or interfaces) that are the
     * implementation of their respective interface.
     *
     * @type {Map<function(new: Object), function(new: Object, ...)>}
     */
    this[PRIVATE.implementations] = new Map()

    /**
     * The created shared instances.
     *
     * @type {Map<function(new: Object, ...*), Object>}
     */
    this[PRIVATE.instances] = new Map()

    /**
     * Set of classes that have been instantiated by this dependency injector.
     * The set is used to "mark" such classes so their default dependencies
     * wont be reconfigured, which would lead to inconsistent behavior.
     *
     * @type {Set<function(new: Object, ...*)>}
     */
    this[PRIVATE.instantiatedClasses] = new Set()

    ;[
      PRIVATE.dependencies,
      PRIVATE.implementations,
      PRIVATE.instances,
      PRIVATE.instantiatedClasses
    ].forEach(property => Object.defineProperty(this, property, {
      writable: false
    }))
    Object.seal(this)
  }

  /**
   * Returns a shared instance of the specified class or interface.
   *
   * If the instance does not exist yet and must be created, the class
   * constructor will receive either the configured dependencies (if class
   * dependencies have been configured) or the default dependencies specified
   * by class (if class dependencies have not been configured).
   *
   * If an interface is provided, the method will first retrieve the configured
   * implementing class and use the class instead.
   *
   * @template T
   * @param {function(new: T, ...*)} classConstructor The class constructor, or
   *        interface, of which the dependency injector should create an
   *        instance. The dependency injector will use the configured
   *        implementing class if an interface is provided.
   * @return {T} The shared instance of the specified class or interface.
   */
  get(classConstructor) {
    let implementation = this[PRIVATE.getImplementation](classConstructor)

    if (this[PRIVATE.instances].has(implementation)) {
      return this[PRIVATE.instances].get(implementation)
    }

    let instance = this.create(implementation)
    this[PRIVATE.instances].set(implementation, instance)

    return instance
  }

  /**
   * Creates and returns a new instance of the specified class or interface.
   * The method uses the configured or default dependencies for the class if no
   * dependencies are provided.
   *
   * If an interface is provided, the method will first retrieve the configured
   * implementing class and use the class instead.
   *
   * @template T
   * @param {function(new: T, ...*)} classConstructor The class constructor, or
   *        interface, of which the dependency injector should create an
   *        instance. The dependency injector will use the configured
   *        implementing class if an interface is provided.
   * @param {...(function(new: Object, ...*)|*)} dependencies The dependencies
   *        to pass to the class constructor. The constructor will receive
   *        shared instances of specified classes and interfaces. The
   *        non-function values are passed in without modification.
   * @return {T} The created instance.
   */
  create(classConstructor, ...dependencies) {
    let implementation = this[PRIVATE.getImplementation](classConstructor)

    if (!dependencies.length) {
      if (this[PRIVATE.dependencies].has(implementation)) {
        dependencies = this[PRIVATE.dependencies].get(implementation)
      }
    }

    if (!dependencies.length) {
      let dependenciesGetterName = this[PRIVATE.dependenciesGetterName]
      if (implementation.hasOwnProperty(dependenciesGetterName)) {
        dependencies = implementation[dependenciesGetterName]
      } else {
        console.warn("No dependencies were provided for the " +
            `${classConstructor.name} interface/class (implemented by the ` +
            `${implementation.name} class), nor were any configured for the ` +
            "the implementation class, nor does the implementation class " +
            "specify its default dependencies using the " +
            dependenciesGetterName + " static property. The constructor " +
            "will be called with no arguments");
      }
    }

    let dependencyInstances = dependencies.map((dependency) => {
      if (dependency instanceof Function) {
        return this.get(dependency)
      } else {
        return dependency
      }
    })

    let instance = new implementation(...dependencyInstances)

    // we want to mark this even if custom dependencies have been provided, to
    // ensure easier debugging and earlier error detection
    this[PRIVATE.instantiatedClasses].add(implementation)

    return instance
  }

  /**
   * Sets custom dependencies to inject into the specified class constructor
   * when creating an instance. This will override the default dependencies
   * specified by the class (if the class specifies them).
   *
   * Once configured, the dependencies cannot be changed to ensure consistency
   * throughout the application. The dependencies also cannot be configured if
   * an instance of the class has already been created by this dependency
   * injector (using either custom or the class's default dependencies).
   *
   * @param {function(new: Object)} classConstructor The class that should have
   *        its default dependencies configured.
   * @param {...(function(new: Object, ...*)|*)} dependencies The default
   *        dependencies to pass to the class constructor when creating a new
   *        instance, unless custom dependencies are provided. The dependencies
   *        can be classes, interfaces or non-function values.
   */
  configure(classConstructor, ...dependencies) {
    if (this[PRIVATE.dependencies].has(classConstructor)) {
      throw new Error(`The ${classConstructor.name} class has already been ` +
          "configured in this dependency injector")
    }
    if (this[PRIVATE.implementations].has(classConstructor)) {
      throw new Error(`The provided ${classConstructor.name} class is ` +
          "already registered as an interface in this dependency injector")
    }
    if (this[PRIVATE.instantiatedClasses].has(classConstructor)) {
      throw new Error(`The ${classConstructor} class cannot have its ` +
          "default dependencies reconfigured since an instance has already " +
          "been created");
    }

    this[PRIVATE.dependencies].set(classConstructor, dependencies)
  }

  /**
   * Sets the default implementing class for the specified interface. Whenever
   * an instance of the of the specified interface is requested from this
   * dependency injector after the call to this method, the dependency injector
   * will provide an instance of the specified implementation class.
   *
   * It is possible to specify another interface as implementation. The
   * dependency injector will automatically follow the "implemented-by" chain
   * when creating an instance.
   *
   * Note that the dependency injector does not check whether the provided
   * implementation class does extend the interface, as you may want to
   * implement multiple interfaces, and it is impossible (in ES2015) to extend
   * two classes at the same time.
   *
   * @param {function(new: Object)} interfaceConstructor
   * @param {(function(new: Object, ...*)|function(new: Object))} implementation
   *        The default implementation of the interface to use to create
   *        instances of the interface.
   */
  setImplementation(interfaceConstructor, implementation) {
    if (this[PRIVATE.implementations].has(interfaceConstructor)) {
      throw new Error("The implementation of the " +
          interfaceConstructor.name + " interface is already set to the " +
          implementation.name + " class")
    }
    if (this[PRIVATE.dependencies].has(interfaceConstructor)) {
      throw new Error(`The ${interfaceConstructor.name} class provided as ` +
          "the interface is already configured with dependencies in this " +
          "dependency injector, thus it cannot be used as an interface " +
          "(interfaces do not have dependencies)")
    }

    this[PRIVATE.implementations].set(interfaceConstructor, implementation)
  }

  /**
   * Clears the internal registry of instances created using the
   * {@linkcode get} method.
   */
  clear() {
    this[PRIVATE.instances].clear()
  }

  /**
   * Sets the static class getter/property name this dependency injector uses
   * to retrieve the default dependencies of a class.
   *
   * Note that this property can be changed only once (to prevent configuration
   * conflicts) and cannot be changed after this dependency injector has been
   * used to create a class instance (to prevent behavior inconsistencies).
   *
   * @param {string} newName The new name of the getter/property to use to
   *        retrieve the default dependencies of a class.
   */
  set dependenciesPropertyName(newName) {
    if (this[PRIVATE.dependenciesGetterName] === newName) {
      return
    }

    if (this[PRIVATE.dependenciesGetterNameChanged]) {
      throw new Error("The dependencies getter/property name has already " +
          "been changed once on this dependency injector (currently changed " +
          `to ${this[PRIVATE.dependenciesGetterName]}, attempted to change ` +
          `to ${newName}). The name wont be changed to prevent ` +
          "inconsistency during the dependency injector's lifetime.")
    }

    if (this[PRIVATE.instantiatedClasses].size) {
      throw new Error("The dependencies getter/property name cannot be " +
          "changed after this dependency injector has been used to create " +
          "class instances because of possible behavior consistency issues.")
    }

    this[PRIVATE.dependenciesGetterName] = newName
    this[PRIVATE.dependenciesGetterNameChanged] = true
  }

  /**
   * Returns the current static class getter/property name this dependency
   * injector uses to retrieve the default dependencies of a class. Defaults to
   * {@code "dependencies"}.
   *
   * @return {string} The current static class getter/property name this
   *         dependency injector uses to retrieve the default dependencies of a
   *         class.
   */
  get dependenciesPropertyName() {
    return this[PRIVATE.dependenciesGetterName]
  }

  /**
   * Retrieves the implementation class configured as the current default
   * implementation of the specified interface. If another interface is
   * specified as the implementation, the method follows the implementation
   * chain until it finds the implementation class.
   *
   * @param {function(new: Object)} interfaceConstructor The interface for
   *        which the method should retrieve the configured implementation
   *        class.
   * @return {function(new: Object, ...*)} The currently configured
   *         implementation of the interface, or the provided interface if no
   *         implementation is known.
   */
  [PRIVATE.getImplementation](interfaceConstructor) {
    if (!this[PRIVATE.implementations].has(interfaceConstructor)) {
      return interfaceConstructor
    }

    return this[PRIVATE.getImplementation](
      this[PRIVATE.implementations].get(interfaceConstructor)
    )
  }
}

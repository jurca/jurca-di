# jurca-di

[![Build Status](https://travis-ci.org/jurca/jurca-di.svg?branch=master)](https://travis-ci.org/jurca/jurca-di)
[![npm](http://img.shields.io/npm/v/jurca-di.svg)](https://www.npmjs.com/package/jurca-di)
[![License](https://img.shields.io/npm/l/jurca-di.svg)](LICENSE)

A dependency injector for ECMAScript with support for interfaces, type-based
dependency configuration and default dependencies.

## Quickstart

To install `jurca-di` dependency injector into your project, simply use npm:

```
npm install jurca-di
```

The main class, `DependencyInjector` is located in the
`es2015/DependencyInjector.js` file. The project is written in ES2015 (ES6),
so, if you need to use it in an environment that does not support ES2015, you
will need a transpiler, for example [babel](https://babeljs.io/) or
[traceur](https://github.com/google/traceur-compiler). You may also need a JS
module library/polyfill if you intend to use this library in a browser, for
example [SystemJS](https://github.com/systemjs/systemjs).

## Usage

The Dependency Injector is used for:

- managing class dependency configuration
- configuring the preferred implementations of interfaces (unimplemented
  classes in case of E2015)
- a registry of shared class instances - this is useful for classes that are
  used as services.

Note that this dependency injector implementation supports only dependencies
that are passed in through the class constructor.

To use this dependency injector, an instance must be first created:

```javascript
import DependencyInjector from "jurca-di/es2015/DependencyInjector"

let di = new DependencyInjector()
```

Every instance has its own configuration and instance registry, nothing is
shared.

### Dependency configuration

Class constructor dependencies are configured using the `configure()` method:

```javascript
di.configure(MyClass, firstConstructorDependency, secondConstructorDependency)
```

You may provide any number of dependencies, they will be passed into the
constructor in the same order.

The provided dependencies will be passed in as provided, except for class
references (constructor functions) - the dependency injector will use their
**shared** instances in their place.

Note that the dependency injector does not check for cyclic dependencies, so if
you happen to create one in your configuration, it will result in an infinite
loop.

The order in which the dependencies are configured is irrelevant.

### Default dependencies

Your classes may specify their dependencies (useful especially if you use
interfaces to wire everything up). To do that, simply declare a static
`dependencies` property on your class:

```javascript
class MyClass {
  static get dependencies() {
    return [firstConstructorDependency, secondConstructorDependency]
  }
}

// or

class MyClass { ... }
MyClass.dependencies = [
  firstConstructorDependency,
  secondConstructorDependency
]
```

If, for any reason, you need to use a different name for the property, you may
configure it like this:

```
di.dependenciesPropertyName = "deps"

class MyClass {
  // now we can use the deps property instead of the dependencies property
  static get deps() {
    return [firstConstructorDependency, secondConstructorDependency]
  }
}
```

### Creating shared and individual instances

You will usually need to create or retrieve the shared instances of configured
classes. The dependency injector creates these lazily upon first time the
instance is needed, either because it was requested, or as a dependency for
another class.

The create or retrieve a shared instance, use the `get()` method:

```javascript
let instance = di.get(MyClass)
let sameInstance = di.get(MyClass)
// instance === sameInstance
```

In case that you need to create a new private instance of a class, use the
`create()` method:

```javascript
let instance = di.create(MyClass)
```

The `create()` method also allows you to pass in custom dependencies into the
class constructor:

```javascript
let instance = di.create(MyClass, foo, bar, baz)
```

### Usage with interfaces

The dependency injector allows you to use interfaces (empty classes) as
dependencies and specifying the implementation of them to use instead to
simplify wiring things up. This is especially useful in combination with
default class dependencies and allows you to globally swap an implementing
class in the application by editing a single configuration line.

To configure the class the dependency injector should use as implementation of
an interface, use the `setImplementation()` method:

```javascript
di.setImplementation(FooInterface, FooImplementation)

let instance = di.get(FooInterface)
// (instance instanceof FooImplementation) === true
```

It is also possible to specify another interface as an interface
implementation. The dependency injector will follow the implementation chain to
the class:

```javascript
di.setImplementation(FooInterface, BarInterface)
di.setImplementation(BarInterface, BarImplementation)

let instance = di.get(FooInterface)
// (instance instanceof BarImplementation) === true
```

## The current state of this project

There are no current plans for additional features (unless a good case for
adding them is made), but the project accepts bug fixes if new bugs are
discovered.

## Contributing

Time is precious, so, if you would like to contribute (bug fixing, test writing
or feature addition), follow these steps:

- fork
- implement (follow the code style)
- pull request
- wait for approval/rejection of the pull request

Filing a bug issue *might* get me to fix the bug, but filing a feature request
will not as I don't have the time to work on this project full-time. Thank you
for understanding.

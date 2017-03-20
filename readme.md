# T-rex

A simplified application state container based on the component/service paradigm

### Who am I

T-rex is a transactional state container for SPA applications like Angular & React.
It relies on Typescript syntax for intercepting component calls and ZoneJS mechanism for
tracking asynchronous activities.
While using T-rex inside Angular/React applications is simple you can also use T-rex
in any JavaScript application

### Installation

```sh
$ npm install t-rex
```

### Getting Started

First, define application state

```sh
interface AppState {
    counter: number
}
```
Then, define a service which manages a single aspect of the application state. In our case this is the **counter** field

```sh
class CounterService {
    store = ServiceStore.create<AppState>("/", {
        counter: 0,
    });
    
    get state() {
        return this.store.getState();
    }
    
    @Activity()
    inc() {
        this.store.update({
            counter: this.state.counter + 1,
        });
    }
    
    @Activity()
    dec() {
        this.store.update({
            counter: this.state.counter - 1,
        });
    }
}
```

Then, create the backing appStore instance and register each service into it

```sh
const counterService = new CounterService();

const appStore = new AppStore<AppState>();
appStore.init([
    counterService
]);
```

Inside your component you deal with a specific service instance (like, CounterService) and forget about the backing appStore instance.

```sh
class ToolbarComponent {
    constructor(private counterService: CounterService){
    }
    
    onIncButtonClicked() {
        this.counterService.inc();
    }
    
    onDecButtonClicked() {
        this.counterService.dec();
    }
}
```

Other components can listen to the change event 

```sh
class CounterComponent {
    constuctor(counterService: CounterService) {
        counterService.subscribe(counter => {
            //
            //  Do something with the new counter
            //
        });
    }
}
```

The power of T-rex resides inside the ability to compose methods from different services but still keep a single transaction

For example, we want to maintain a counter which counts the number of end user activities. Every time the user logs-in or logs-out we want to increment the activity counter

```sh
interface AppState {
    counters: CountersState,
    auth: AuthState,
}

interface AuthState {
    userName: string,
    roles: string[]
}

interface CountersState {
    activityCount: number;
}

class CountersService {
    store = ServiceStore.create<AppState>("counters", {
        activityCount: 0,
    });
    
    get state() {
        return this.store.getState();
    }
    
    @Activity()
    incActivity() {
        this.store.update({
            activityCount: this.state.activityCount + 1,
        });
    }
}

class AuthService {
    store = ServiceStore.create<AuthState>("auth", {
        userName: null,
        roles: null,
    });
    
    @Activity()
    login() {
        this.store.update({
            userName: "ori",
            roles: ["admin"]
        });
    }
    
    @Activity()
    logout() {
        this.store.update({
            userName: null,
            roles: null
        });
    }
}

class RootService {
    store = ServiceStore.create<AppState>("/", {
    });
    
    constructor(private countersService: CountersService, private authService: AuthService){
    }
    
    @Activity()
    loginAndIncActivityCount() {
        this.authService.login();
        this.countersService.incActivity();
    }
}

const countersService = new CountersService();
const authService = new AuthService();
const rootService = new RootService();

const appStore = new AppStore<AppState>();
appStore.init([
    rootService
    countersService
    rootService
]);
```

Only if both **inc()** and **login()** complete successfully then the backing appStore is updated and all subscribers are notified

T-rex support asynchronous operations. Continuing with above example we can return a promise from an action and the transaction decorator monitors the completeness of the action and only then updates the backing appStore

```sh
@Activity(): Promise<void>
loginAndIncActivityCount() {
    return Promise.resolve()
        .then(()=>this.couterStore.inc())
        .then(()=>this.authStore.login());
}
```

Or, in case you are using async/await syntax

```sh
@Activity(): Promise<void>
async loginAndIncActivityCount() {
    await this.couterStore.inc();
    await this.authStore.login();
}
```

### Samples
Inside the repository you may find the **samples** directory which contains samples for both Angular1 and Angular2. Just run the following commands inside each directory sample
```sh
npm install
npm start
```

### License

MIT

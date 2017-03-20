# TxSvc

A transactional state container for SPA applications

### Who am I

TxSvc is a transactional state container for SPA applications like Angular & React.
It relies on Typescript syntax for intercepting component calls and ZoneJS mechanism for
tracking asynchronous activities.
While using TxSvc inside Angular/React applications is simple you can also use TxSvc
in any JavaScript application

### Installation

```sh
$ npm install txsvc
```

### Getting Started

First, define application state

```sh
interface AppState {
    counter: number
}
```
Then, define the store which manages a single aspect of the application state. In our case this is the **counter** field

```sh
class CounterStore {
    store = ServiceStore.create<AppState>("/", {
        counter: 0,
    });
    
    get state() {
        return this.store.getState();
    }
    
    @Transaction()
    inc() {
        this.store.update({
            counter: this.state.counter + 1,
        });
    }
    
    @Transaction()
    dec() {
        this.store.update({
            counter: this.state.counter - 1,
        });
    }
}
```

Then, create the backing appStore instance and register each store into it

```sh
const counterStore = new CounterStore();

const appStore = new AppStore<AppState>();
appStore.init([
    counterStore.store
]);
```

Inside your component you deal with a specific store instance (like, CounterStore) and forget about the backing appStore instance.

```sh
class ToolbarComponent {
    constructor(private counterStore: CounterStore){
    }
    
    onIncButtonClicked() {
        this.counterStore.inc();
    }
    
    onDecButtonClicked() {
        this.counterStore.dec();
    }
}
```

Other components can listen to the change event 

```sh
class CounterComponent {
    constuctor(counterStore: CounterStore) {
        counterStore.subscribe(counter => {
            //
            //  Do something with the new counter
            //
        });
    }
}
```

The power of TxSvc resides inside the ability to compose actions from different stores

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

class CountersStore {
    store = ServiceStore.create<AppState>("counters", {
        activityCount: 0,
    });
    
    get state() {
        return this.store.getState();
    }
    
    @Transaction()
    incActivity() {
        this.store.update({
            activityCount: this.state.activityCount + 1,
        });
    }
}

class AuthStore {
    store = ServiceStore.create<AuthState>("auth", {
        userName: null,
        roles: null,
    });
    
    @Transaction()
    login() {
        this.store.update({
            userName: "ori",
            roles: ["admin"]
        });
    }
    
    @Transaction()
    logout() {
        this.store.update({
            userName: null,
            roles: null
        });
    }
}

class RootStore {
    store = ServiceStore.create<AppState>("/", {
    });
    
    constructor(private countersStore: CountersStore, private authStore: AuthStore){
    }
    
    @Transaction()
    loginAndIncActivityCount() {
        this.authStore.login();
        this.countersStore.incActivity();
    }
}

const countersStore = new CountersStore();
const authStore = new AuthStore();
const rootStore = new RootStore();

const appStore = new AppStore<AppState>();
appStore.init([
    rootStore.store
    counterStore.store
    counterStore.store
]);
```

Only if both **inc()** and **login()** complete successfully then the backing appStore is updated and all subscribers are notified

TxSvc support asynchronous operations. Continuing with above example we can return a promise from an action and the transaction decorator will monitor the completeness of the action and only then will update the backing appStore

```sh
@Transaction(): Promise<void>
loginAndIncActivityCount() {
    return Promise.resolve()
        .then(()=>this.couterStore.inc())
        .then(()=>this.authStore.login());
}
```

Or, in case you are using async/await syntax

```sh
@Transaction(): Promise<void>
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

import {Injectable} from "@angular/core";
import {Activity} from "t-rex/decorators";
import {ServiceStore} from "t-rex/ServiceStore";

export interface UserDetails {
    id: number;
    name: string;
}

export interface AuthState {
    user: UserDetails;
    lastLoginDate: Date;
}

@Injectable()
export class AuthService {
    public store = ServiceStore.create<AuthState>("auth", {
        user: null,
        lastLoginDate: null
    });

    constructor() {
    }

    @Activity()
    login(name, password) {
        this.store.update({
            user: {
                id:1,
                name: "Ori",
            }
        });
    }

    @Activity()
    logout() {
        this.store.update({
            user: null,
        });
    }
}

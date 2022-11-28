import { defineStore } from 'pinia'
import * as Openbis from '../openbis/service/openbis'
import * as Mol from '../api/molecule'

interface LoginData {
    user: string | null,
    token: string | null,
    loggedIn: boolean
}



function storeToken(data: LoginData){
    localStorage.setItem('login', JSON.stringify(data))
}


function retrieveToken(): LoginData | null {
    return JSON.parse(localStorage.getItem('login'))
}

export const useUser = defineStore('user',
    {
        state: (): LoginData => {
            return {
                user: null,
                token: null,
                loggedIn: false
            }
        },
        actions: {
            async init(){
                const loginInfo = retrieveToken();
                const valid = loginInfo? await Openbis.checkToken(loginInfo.token) : false ;
                if(valid){
                    this.token = loginInfo.token;
                    this.user =  loginInfo.user;
                    this.loggedIn = true;
                }else{
                    this.$reset();
                }
            },
            async login(user: string, password: string) {
                const token = await Openbis.login(user, password);
                this.user = user;
                this.token = token;
                this.loggedIn = true;
                storeToken({user: this.user, token: this.token, loggedIn: this.loggedIn})
            }
        }
    }
)
import { useUser } from "../openbis/store/login";
import * as Openbis from '../openbis/service/openbis' 
const userStore = useUser()


export async function getToken(): Promise<string>{
    if (userStore.loggedIn && await  Openbis.checkToken(userStore.token)){
        return userStore.token;
    }else{
        throw new Error("Token invalid")
    }
}
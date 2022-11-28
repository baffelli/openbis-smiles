import { defineStore } from 'pinia'

import * as Openbis from '../service/openbis';
import * as Interfaces from '../model/utils';

import { getToken } from '../helpers/auth'

interface Getters { }

interface Actions {
    populate(),
    getAllCollections(): Interfaces.OpenbisCollection
}

interface State {
    instance: Interfaces.OpenbsInstance
}

export const useOpenbis = defineStore<string, State, Getters, Actions>(
    "openbis",
    {
        state: (): State => {
            return {
                instance: {
                spaces: undefined as Interfaces.OpenbisSpace[],
                objectTypes: undefined as Interfaces.OpenbisObjectType[]
            } as Interfaces.OpenbsInstance,
        }
            
    },
    actions:
    {
        async populate() {
            const token = await getToken()
            const tree = await Openbis.getTree(token)
            
            const objectTypes = await Openbis.getObjectTypes(token) as Interfaces.OpenbisObjectType[]
            
            const inst = {
                spaces: tree.spaces,
                objectTypes: objectTypes
            } as Interfaces.OpenbsInstance
            this.instance = inst;
        },
        getAllCollections(): Interfaces.OpenbisCollection[] {

            const colls = this?.instance.spaces.flatMap(space => {
                return space?.projects.flatMap(proj => {
                    return proj?.experiments.flatMap(coll => coll)
                })
            })
            return colls

        },
    }
    }

)
import { faProductHunt } from '@fortawesome/free-brands-svg-icons';
import { defineStore } from 'pinia'

import * as Mol from '../api/molecule';
import * as Openbis from '../api/openbis';
import * as Interfaces from '../components/utils';

import { getToken } from './auth'

interface Getters { }

interface Actions {
    populate(),
    getAllCollections(): Interfaces.OpenbisCollection[],
    getCollection(code: string, type: string, count: number),
    sortCollection(fields: string[]),
    toPage(page: number),
    nextPage(),
    previousPage()
}

interface State {
    instance: Interfaces.OpenbsInstance
    currentCollection: Interfaces.OpenbisCollection | null,
    currentPage: number
    currentType: string | null
    collectionSize: null | number
    pageSize: number
    sortFields: string[] | null
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
            currentCollection: {"samples": [] as Interfaces.OpenbisObject[], identifier: {identifier: null} as Interfaces.Identifier} as Interfaces.OpenbisCollection,
            currentPage: 1,
            currentType: null,
            pageSize: 1,
            sortFields: null,
            collectionSize: 0
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
        async getCollection(code: string, type: string, count: number, sortFields: string[] | null = null){
            const token = await getToken()
            const coll = await Openbis.getCollection(token, code, type, true, this.currentPage  * this.pageSize, count, sortFields)
            this.currentCollection = coll;
            this.currentType = type;
            this.pageSize = count;
            this.collectionSize = coll?.totalCount ?? 1
        },
        async sortCollection(fields: String[]){
            await this.getCollection(this.currentCollection.identifier.identifier, this.currentType, this.pageSize, fields)
        },
        async updateCollection(){
            await this.getCollection(this.currentCollection.identifier.identifier, this.currentType, this.pageSize)
        },
        async nextPage(){
            this.currentPage += 1
            await this.updateCollection()
        },
        async previousPage(){
            this.currentPage -= 1
            await this.updateCollection()
        },
        async toPage(page: number){
            this.currentPage = page
            await this.updateCollection()
        }
    }
    }

)
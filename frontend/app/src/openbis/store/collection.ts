import { defineStore, Store, StoreDefinition } from 'pinia'
import {ref, computed} from 'vue'
import * as Openbis from '../service/openbis';
import * as Interfaces from '../model/utils';

import { getToken } from '../helpers/auth'

interface Getters { }

interface Actions {
    retreiveCollection(code: String): Interfaces.OpenbisCollection | null,
    populate(code: string),
    getAllCollections(): Interfaces.OpenbisCollection[],
    getCollection(code: string, type: string, count: number),
    sortCollection(code: string, fields: string[]),
    toPage(code: string, page: number),
    nextPage(code: string),
    previousPage(code: string)
}

interface CollectionInfo {
    currentCollection: Interfaces.OpenbisCollection | null,
    currentPage: number
    currentType: string | null
    collectionSize: null | number
    pageSize: number
    sortFields: string[] | null
}

interface State {
    collections: CollectionInfo[] | unknown
}



export class collectionCreator {

    public static collectionStore(id: string): Store<string, State, Getters, Actions> {
        const useCollection = defineStore<string, State, Getters, Actions>(
            id,
            () => {
                const collections = ref({ "samples": [] as Interfaces.OpenbisObject[], identifier: { identifier: null } as Interfaces.Identifier } as Interfaces.OpenbisCollection)
            })
    }
}
    //         {
    //             state: (): State => {
    //                 return {
    //                     collections: [
    //                         {
    //                             currentCollection: { "samples": [] as Interfaces.OpenbisObject[], identifier: { identifier: null } as Interfaces.Identifier } as Interfaces.OpenbisCollection,
    //                             currentPage: 1,
    //                             currentType: null,
    //                             pageSize: 1,
    //                             sortFields: null,
    //                             collectionSize: 0
    //                         }

    //                     ]
    //                 } as State

    //             },
    //             actions:
    //             {
    //                 retreiveCollection(code: String){
    //                     this.collections.find((c) => c.currentCollection.identifier == code)
    //                 },
    //                 async populate() {
    //                     const token = await getToken()
    //                     const tree = await Openbis.getTree(token)

    //                     const objectTypes = await Openbis.getObjectTypes(token) as Interfaces.OpenbisObjectType[]

    //                     const inst = {
    //                         spaces: tree.spaces,
    //                         objectTypes: objectTypes
    //                     } as Interfaces.OpenbsInstance
    //                     this.instance = inst;
    //                 },
    //                 getAllCollections(): Interfaces.OpenbisCollection[] {

    //                     const colls = this?.instance.spaces.flatMap(space => {
    //                         return space?.projects.flatMap(proj => {
    //                             return proj?.experiments.flatMap(coll => coll)
    //                         })
    //                     })
    //                     return colls

    //                 },
    //                 async getCollection(code: string, type: string, count: number, sortFields: string[] | null = null) {
    //                     const token = await getToken()
    //                     const coll = await Openbis.getCollection(token, code, type, true, this.currentPage * this.pageSize, count, sortFields)
    //                     const returnedColl = {
    //                         currentCollection: coll,
    //                         currentType: type,
    //                         pageSize: count,
    //                        collectionSize: coll?.totalCount ?? 1
    //                     } as CollectionInfo
    //                     const newCollections = this.collections.map(c => c.currentCollection.identifier == code ? returnedColl : c )
    //                     this.collections = newCollections

    //                 },
    //                 async sortCollection(code: string, fields: String[]) {
    //                     await this.getCollection(this.currentCollection.identifier.identifier, this.currentType, this.pageSize, fields)
    //                 },
    //                 async updateCollection() {
    //                     await this.getCollection(this.currentCollection.identifier.identifier, this.currentType, this.pageSize)
    //                 },
    //                 async nextPage() {
    //                     this.currentPage += 1
    //                     await this.updateCollection()
    //                 },
    //                 async previousPage() {
    //                     this.currentPage -= 1
    //                     await this.updateCollection()
    //                 },
    //                 async toPage(page: number) {
    //                     this.currentPage = page
    //                     await this.updateCollection()
    //                 }
    //             }
    //         }

    //     )
    //     return useCollection()
    // }




//}
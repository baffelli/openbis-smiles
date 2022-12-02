import { defineStore, Store, StoreDefinition } from 'pinia'
import { ref, computed } from 'vue'
import * as Openbis from '../service/openbis';
import * as Interfaces from '../model/utils';
import { getToken } from '../helpers/auth'
import {FieldSorting} from '@/app/helpers/collectionHelpers'



interface Getters { }

export interface Actions {
    getCollection(code: string, type: string, count: number),
    sortCollection(fields: FieldSorting[]),
    toPage(page: number),
    nextPage(),
    previousPage()
}

export interface CollectionInfo {
    currentCollection: Interfaces.OpenbisCollection | null,
    currentPage: number
    currentType: string | null
    collectionSize: null | number
    pageSize: number
    sortFields: FieldSorting[] | null
}



export class storeDispatcher {
    stores: ReturnType<typeof collectionCreator.createStore>[] | []

    constructor() {
        this.stores = []
    }

    public static createFromId(storeIds: string[]): storeDispatcher {
        const stores = new storeDispatcher()
        storeIds.map((id) => { stores.addStore(id) })
        return stores
    }

    public addStore(id: string) {
        if (!this?.stores.find((s) => s.$id == id)) {
            const store = collectionCreator.createStore(id)
            this.stores = [...this.stores, (store)]
        }
    }

    public getStore(id: string): ReturnType<typeof collectionCreator.createStore> | null {
        return this.stores.find((c) => c.$id == id)
    }



}

export type OpenbisCollectionStore = Store<string, CollectionInfo, Getters, Actions>


export class collectionCreator {

    public static createStore(id: string): OpenbisCollectionStore {
        const useCollection = defineStore<string, CollectionInfo, Getters, Actions>(
            id,
            {
                state: (): CollectionInfo => {
                    return {
                        currentCollection: { "samples": [] as Interfaces.OpenbisObject[], identifier: { identifier: null } as Interfaces.Identifier } as Interfaces.OpenbisCollection,
                        currentPage: 1,
                        currentType: null,
                        pageSize: 1,
                        sortFields: [{field: 'CODE', asc: true} as FieldSorting],
                        collectionSize: 0
                    } as CollectionInfo

                },

                getters: {},
                actions:
                {
                    async getCollection(code: string, type: string, count: number, sortFields: FieldSorting[] | null = null) {
                        const token = await getToken()
                        const coll = await Openbis.getCollection(token, code, type, true, this.currentPage * this.pageSize, count, sortFields)
                        this.currentCollection = coll
                        this.currentType = type
                        this.pageSize = count
                        this.collectionSize = coll?.totalCount ?? 0
                        this.sortFields = sortFields  ?? this.sortFields

                    },
                    async sortCollection(fields: FieldSorting[]) {
                        await this.getCollection(this.currentCollection.identifier.identifier, this.currentType, this.pageSize, fields)
                    },
                    async updateCollection() {
                        await this.getCollection(this.currentCollection.identifier.identifier, this.currentType, this.pageSize)
                    },
                    async nextPage() {
                        this.currentPage += 1
                        await this.updateCollection()
                    },
                    async previousPage() {
                        this.currentPage -= 1
                        await this.updateCollection()
                    },
                    async toPage(page: number) {
                        this.currentPage = page
                        await this.updateCollection()
                    }
                }
            }

        )
        return useCollection()
    }




}

export type validDataTypes = 'string' | 'boolean' | 'number' | 'object' | 'date';



export interface JSONRPCRequest {
    method: string
    params: any[]
    id: string
    jsonrpc: string
}

export interface JSONRPCResponse<T> {
    id: string
    jsonrpc: string
    result: OpenbisResponse<T> | T
}

export interface PermId {
    permId: string
}


export interface PropertyAssignmentPermId {
    entityTypeId: PermId,
    propertyTypeId: PermId
}

export interface EntityTypePermId {
    entityKind: string,
    permId: string
}

export interface Identifier {
    identifier: string
}

export interface OpenbisRawResponse<T>{
    "@type": string;
    "@id": string;
    "objects"?:  T | T[] | null;
    "totalCount"?: number | null;
    [key: string]: T | string | number | null | T[];
}

export type OpenbisListResponse<T> = {
    "@type": string;
    "@id": string;
    "objects":  T[] | null | number;
    "kind": "listResponse"
}

export type OpenbisMapResponse<T> = {
    [key: string]: T | string | number;
    "kind": "singleResponse"
}

export type OpenbisSearchResponse<T> = {
    "@type": string;
    "@id": string;
    "objects":  T[] | null;
    "totalCount": number | null;
    "kind": "searchResponse"
}

export type OpenbisResponse<T> = OpenbisListResponse<T> | OpenbisMapResponse<T> | OpenbisSearchResponse<T>


export function parseOpenbisResponse<T>(input: OpenbisRawResponse<T>): OpenbisResponse<T> {
    if (Object.hasOwn(input, "@type") && !Object.hasOwn(input, "totalCount")) {
        return {
            "@id": input["@id"],
            "@type": input["@type"],
            objects: input?.objects,
            kind: "listResponse"
        } as OpenbisListResponse<T>
    } else if (Object.hasOwn(input, "@type") && Object.hasOwn(input, "totalCount")){
        return {
            "@id": input["@id"],
            "@type": input["@type"],
            objects: input?.objects,
            "totalCount": input?.totalCount,
            kind: "searchResponse"
        } as OpenbisSearchResponse<T>
    }
    else {
        return { kind: "singleResponse", ...input } as OpenbisMapResponse<T>
    }
}




export interface OpenbisEntity {
    kind: string
    code: string
    identifier: Identifier | null
    permId: PermId | null
    attributes: object | null
}

export interface OpenbisProperties{
    [key: string]: string
}

export interface OpenbisObject extends OpenbisEntity {
    kind: 'Sample'
    properties: OpenbisProperties
    type: OpenbisObjectType
    children: OpenbisObject[] | null
    parents: OpenbisObject[] | null
}

export interface OpenbisCollection extends OpenbisEntity {
    kind: 'Collection'
    totalCount?: number | null
    samples: OpenbisObject[] | null
}

export interface OpenbisProject extends OpenbisEntity {
    kind: 'Project'
    collections: OpenbisCollection[] | null
    samples: OpenbisObject | null
}

export interface OpenbisSpace extends OpenbisEntity {
    kind: 'Space'
    projects: OpenbisProject[] | null
}

export interface OpenbisTree extends OpenbisEntity {
    spaces: OpenbisSpace[] | null
}

export interface OpenbsInstance extends OpenbisTree {
    objectTypes: OpenbisObjectType[] | null
}


export interface OpenbisPerson extends OpenbisEntity {
    kind: 'Person'
    active: Boolean
    email: string | null
    firstName: string | null
    lastName: string | null
    registrator: OpenbisPerson
    space: OpenbisSpace
    userId: string
}

export interface PropertyMapping {
    commonName: string
    openbisPropertyName: string
    label: string | null
    dataType: validDataTypes
}

export interface OpenbisObjectConfiguration<T> {
    openbisType: string
    prefix: string
    properties: {[Property in keyof T]: PropertyMapping}
}

export interface MappedOpenbisObjectEntry {
    name: string,
    value: object,
    dataType: validDataTypes
}

export interface MappedOpenbisObject {
    [k: string]: MappedOpenbisObjectEntry
}


export interface MappedOpenbisCollection {
    objects: MappedOpenbisObject[] | null
}


export interface OpenbisPropertyType extends OpenbisEntity {
    kind: 'Property'
    permId: PermId,
    code: string
    label: string | null
    description: string | null
    dataType: string
}

export interface OpenbisPropertyAssignment {
    permId: PropertyAssignmentPermId
    section: string | null
    ordinal: number
    mandatory: boolean
    propertyType: OpenbisPropertyType
}

export interface OpenbisObjectType extends OpenbisEntity {
    permId: EntityTypePermId,
    code: string,
    description: string | null,
    propertyAssignments: OpenbisPropertyAssignment[]
    semanticAnnotations: Object | null
}

export class InChI{
    value: string
    static prefix = "InChI="

    constructor(descriptor: string){
        this.value = `${InChI.prefix}${descriptor}`
    }
    static fromInchi(inchi: string): InChI{
        if(inchi.startsWith(InChI.prefix)){
            return new InChI(inchi.replace(InChI.prefix, ""))
        }
    }
}

export function expandObject<T>(data: OpenbisObject, config: OpenbisObjectConfiguration<T>): T {
    const pairs = Object.entries(data.properties).map(
        ([key, value]) => {
            const [propKey, propValue] = Object.entries<PropertyMapping>(config.properties).find(([k, o]) => o.openbisPropertyName == key)
            if (propValue) {
                return [propKey, value]
            }

        }
    )
    return Object.fromEntries(pairs.filter(x => x)) as T
}

export function reverseMapping<T>(data: T, config: OpenbisObjectConfiguration<T>): OpenbisProperties{
    const newProps = Object.entries(data).map(
        ([key, value]) => {

            const [objectKey, openbisConfig] = Object.entries<PropertyMapping>(config.properties).find(([k, o]) => k == key)
            return [openbisConfig.openbisPropertyName, value as string]
        }
    )
    const props = Object.fromEntries<string>(newProps.filter(x => x))
    return props
}


type SortOptionsLiterals = "as.dto.sample.fetchoptions.SampleSortOptions" | "as.dto.experiment.fetchoptions.ExperimentSortOptions" | "as.dto.space.fetchoptions.SpaceSortOptions" | "as.dto.property.fetchoptions.PropertyFetchOptions" | "as.dto.sample.fetchoptions.SampleTypeFetchOptions"



export class SortOrder {
    "@type": string
    asc: boolean
    constructor(asc: true) {
        this["@type"] = "as.dto.common.fetchoptions.SortOrder"
        this.asc = asc
    }
}

export class Sorting {
    "@type": "as.dto.common.fetchoptions.Sorting"
    field: string | null 
    
    order: SortOrder
    parameters: Object | null
    constructor(property: string | null) {
        this["@type"] = "as.dto.common.fetchoptions.Sorting"
        this.field = (property.toUpperCase() === 'CODE') ? "CODE" : `PROPERTY${property}` 
        this.order = new SortOrder(true)
        this.parameters = null
    }
}

interface SortOptions<T> {
    "@type": String
}   

export class ObjectSortOptions implements SortOptions<OpenbisObject>{
    "@type": SortOptionsLiterals;
    sortings: Sorting[] | null
    constructor(sortings: Sorting[]) {
        this["@type"] = "as.dto.sample.fetchoptions.SampleSortOptions"
        this.sortings = sortings
    }
}

export class CollectionSortOptions implements SortOptions<OpenbisCollection>{
    "@type": SortOptionsLiterals;
    sortings: Sorting[] | null
    constructor(sortings: Sorting[]) {
        this["@type"] = "as.dto.experiment.fetchoptions.ExperimentSortOptions"
        this.sortings = sortings
    }
}

export interface FetchOptions<T extends OpenbisEntity> {
    //[key: string]: FetchOptions | string
    "@type": string
    sort: SortOptions<T> | null
}


export function sortByField(fields: string[]): Sorting[] {
    const so = fields.map(fd => new Sorting(fd))
    return so
}

export class ObjectPropertiesFetchOptions implements FetchOptions<OpenbisPropertyType> {
    "@type": string
    sort: SortOptions<OpenbisPropertyType> | null
    constructor() {
        this['@type'] = "as.dto.property.fetchoptions.PropertyFetchOptions"
    }
}


export class ObjectTypeFetchOptions implements FetchOptions<OpenbisObjectType> {
    "@type": string
    "type": string | null
    sort: SortOptions<OpenbisObjectType> | null
    criteria: Object
    constructor(type: string | null) {
        this['@type'] = "as.dto.sample.fetchoptions.SampleTypeFetchOptions"
        this.type = type
    }
}

export class PersonFetchOptions implements FetchOptions<OpenbisPerson> {
    "@type": string
    sort: SortOptions<OpenbisPerson> | null
    constructor() {
        this['@type'] = "as.dto.person.fetchoptions.PersonFetchOptions"
    }
}


export class ObjectFetchOptions implements FetchOptions<OpenbisObject> {
    "@type": string
    properties?: ObjectPropertiesFetchOptions
    parents?: ObjectFetchOptions
    children?: ObjectFetchOptions
    type: ObjectTypeFetchOptions
    registrator: PersonFetchOptions
    from: number | null
    count: number | null
    sampleCount: FetchOptions<OpenbisObject>
    sort: SortOptions<OpenbisObject> | null
    constructor(withProperties: Boolean = true, withChildren: Boolean = true, withParents: Boolean = true, from: number | null = null, count: number | null = null, withType: string | null = null, sortOptions: SortOptions<OpenbisObject> | null = null) {
        this["@type"] = "as.dto.sample.fetchoptions.SampleFetchOptions"
        this.properties = withProperties ? new ObjectPropertiesFetchOptions() : null
        this.children = withChildren ? new ObjectFetchOptions(true, false, false) : null
        this.parents = withParents ? new ObjectFetchOptions(true, false, false) : null
        this.type = new ObjectTypeFetchOptions(withType)
        this.registrator = new PersonFetchOptions()
        this.count = count
        this.from = from
        this.sort = sortOptions ?? new ObjectSortOptions(sortByField(["code"]))
    }
}


export class ExperimentFetchOptions implements FetchOptions<OpenbisCollection> {
    "@type": string
    properties: ObjectPropertiesFetchOptions
    registrator: PersonFetchOptions
    samples: ObjectFetchOptions
    count: true
    sort: SortOptions<OpenbisCollection> | null
    constructor(withProperties: Boolean = true, so: ObjectFetchOptions | null, from: number | null = null, count: number | null = null) {
        this["@type"] = "as.dto.experiment.fetchoptions.ExperimentFetchOptions"
        this.properties = withProperties ? new ObjectPropertiesFetchOptions() : null
        this.registrator = new PersonFetchOptions()
        this.samples = so
    }
}

export interface SearchCriteria {

}


type searchFieldType = "ANY_FIELD" | "ANY_PROPERTY" | "ATTRIBUTE" | "PROPERTY"

type StringValueOperations = "as.dto.common.search.StringEqualToValue" | "as.dto.common.search.AnyStringValue" | "as.dto.common.search.StringContainsExactlyValue" | "as.dto.common.search.StringContainsValue" | "as.dto.common.search.StringMatchesValue"

export class FieldValueOperation {
    "@type": StringValueOperations
    "value": string
}

export interface FieldSearchCriteria {
    "@type": string
    fieldName: string
    fieldType: searchFieldType
    fieldValue: FieldValueOperation | null
}


export class AbstractSearchCriteria implements FieldSearchCriteria {
    "@type": string
    fieldName: string
    fieldType: searchFieldType
    fieldValue: FieldValueOperation | null

    public thatEquals<T extends this>(fieldValue: string): T {
        const matcher = { "@type": "as.dto.common.search.StringEqualToValue", "value": fieldValue } as FieldValueOperation
        const newCriteria = { ...this, ...{ 'fieldValue': matcher } } as T
        return newCriteria
    }

    public thatMatches<T extends this>(fieldValue: string): T {
        const matcher = { "@type": "as.dto.common.search.StringMatchesValue", "value": fieldValue } as FieldValueOperation
        const newCriteria = { ...this, ...{ 'fieldValue': matcher } } as T
        return newCriteria
    }

}

export class PermIdSearchCriteria extends AbstractSearchCriteria {
    declare "@type": string
    constructor() {
        super()
        this["@type"] = "as.dto.common.search.PermIdSearchCriteria"
        this.fieldName = "perm id"
        this.fieldType = "ATTRIBUTE"
    }

}

export class CodeSearchCriteria extends AbstractSearchCriteria {
    declare "@type": string

    constructor() {
        super()
        this["@type"] = "as.dto.common.search.CodeSearchCriteria"
        this.fieldName = "code"
        this.fieldType = "ATTRIBUTE"
    }
}


export class IdentifierSearchCriteria extends AbstractSearchCriteria {
    declare "@type": string

    constructor() {
        super()
        this["@type"] = "as.dto.common.search.IdentifierSearchCriteria"
        this.fieldName = "identifier"
        this.fieldType = "ATTRIBUTE"
    }
}



const a = new CodeSearchCriteria().thatEquals('a')


type SearchOperator = "AND" | "OR"

export class CompositeSearchCriteria {
    "@type": string
    criteria: (CompositeSearchCriteria |AbstractSearchCriteria)[] 
    operator: SearchOperator
    negated: boolean

    constructor(){
        this.negated = false
        this.operator = "AND"
    }

    combineLogical = <T extends this>(c1: CompositeSearchCriteria | AbstractSearchCriteria, op:SearchOperator): T => {
        // const cr = this.criteria ?? []
        // const nc = [c1, ...cr]
        // const ret = {...this, criteria: nc , operator: op} 
        this.criteria = [...this.criteria ?? [], c1]
        this.operator = op
        return this as T
    }

    and = <T extends this>(c1:  CompositeSearchCriteria | AbstractSearchCriteria): T => {
        return this.combineLogical(c1, 'AND')
    }
    or = <T extends this>(c1:  CompositeSearchCriteria | AbstractSearchCriteria): T => {
        return this.combineLogical(c1, 'OR')
    }

    withPermId = <T extends this>(permId: string): T => {
        const cr = new PermIdSearchCriteria().thatEquals(permId)
        const res = this.and(cr)
        return res as T
    }

    withCode = <T extends this>(code: string): T => {
        const cr = new CodeSearchCriteria().thatEquals(code)
        const res = this.and(cr)
        return res as T
    }

    withIdentifier = <T extends this>(identifier: string): T => {
        const cr = new IdentifierSearchCriteria().thatEquals(identifier)
        const res = this.and(cr)
        return res as T
    }

    with = <T extends this>(c1: CompositeSearchCriteria | AbstractSearchCriteria): T => {
        const nc = [c1]
        const ret = {...this, criteria: nc} 
        return ret as T
    }
}


type SampleSearchRelation = "CHILDREN" | "CONTAINER" | "SAMPLE" | "PARENTS"


export class SampleTypeSearchCriteria extends CompositeSearchCriteria {
    declare "@type": string
    
    constructor() {
        super()
        
        this["@type"] = "as.dto.sample.search.SampleTypeSearchCriteria"
    }
}

export class SampleSearchCriteria extends CompositeSearchCriteria {
    declare "@type": string
    relation: SampleSearchRelation
    constructor() {
        super()
        this.relation = "SAMPLE"
        this["@type"] = "as.dto.sample.search.SampleSearchCriteria"
    }

    withType = (type: string): SampleSearchCriteria => {
        const sc = new SampleTypeSearchCriteria().withPermId(type)
        return this.and(sc)
    }


}

export class ExperimentSearchCriteria extends CompositeSearchCriteria {
    declare "@type": string

    constructor() {
        super()
        this["@type"] = "as.dto.experiment.search.ExperimentSearchCriteria"
    }


}



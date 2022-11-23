
import { OpenbisCollection, OpenbisTree, OpenbisResponse, OpenbisObjectType, JSONRPCRequest, ObjectFetchOptions, PersonFetchOptions, ExperimentFetchOptions, JSONRPCResponse, OpenbisSpace, OpenbisListResponse, parseOpenbisResponse, ObjectSortOptions, sortByField} from "@/components/utils";
import { faAngleDoubleRight } from "@fortawesome/free-solid-svg-icons";
import { JsonTypeId } from "jackson-js";
import {JsogService} from "jsog-typescript"
import { describe } from "node:test";
import { setMapStoreSuffix } from "pinia";


const jsog = new JsogService();

export function prepareRequest(method: string, params: any[]): JSONRPCRequest {
    return {
        method: method,
        params: params,
        id: "1",
        jsonrpc: "2.0"

    } as JSONRPCRequest
}



export function openbisRequest(method: string, params: any[], token?: string): Request {
    const apiEndpoint = '/openbis/'
    /* Insert token */
    const pars = token ? [token, ...params] : params;
    const requestBody = prepareRequest(method, pars);
    const req = new Request(apiEndpoint, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    }
    );
    return req
}


export async function handleRequest<T>(req: RequestInfo): Promise<T> {
    const response = await fetch(req);
    if (response.ok) {
        const body = jsog.deserialize(await response?.json()) as JSONRPCResponse<T>
        return body.result as T   
    } else {
        throw new Error(`Error: ${response.status}`);
    }
}

export async function handleOpenbisResponse<T>(req: RequestInfo): Promise<T>{
    const data = parseOpenbisResponse<T>(await handleRequest<OpenbisResponse<T>>(req))
    switch(data.kind){
        case "listResponse" : {return data.objects as T}
        case "singleResponse": {return data as T}
    }
}

export async function login(username: string, password: string): Promise<string> {
    const req = openbisRequest('login', [username, password])
    const token = await handleRequest<string>(req);
    return token
}


export async function checkToken(token: string): Promise<boolean> {
    const req = openbisRequest("isSessionActive", [token])
    const valid = await handleRequest<boolean>(req);
    return valid
}

export async function getTree(token: string, getSamples: Boolean = false): Promise<OpenbisTree> {
    const body =
        [
            {
                "@id": 0,
                "criteria": [],
                "operator": "AND",
                "@type": "as.dto.space.search.SpaceSearchCriteria"
            },
            {
                "@id": 0,
                "registrator": new PersonFetchOptions(),
                "@type": "as.dto.space.fetchoptions.SpaceFetchOptions",
                "projects": {
                    "@type": "as.dto.project.fetchoptions.ProjectFetchOptions",
                    "experiments": new ExperimentFetchOptions(true, getSamples ? new ObjectFetchOptions(false, false, false) : null)
                },
                "sort": null
            }
        ]
    const req = openbisRequest('searchSpaces', body, token)
    const data = await handleOpenbisResponse<OpenbisSpace[]>(req);
    
    const result =   {
            spaces: data
        } as OpenbisTree
    return result

}

export async function getCollections(token: string): Promise<object> {
    const reqData = [
        { "@id": 0, "criteria": [], "operator": "AND", "@type": "as.dto.experiment.search.ExperimentSearchCriteria" },
        new ExperimentFetchOptions(false, new ObjectFetchOptions(false, false, null, null))
    ]
    const req = openbisRequest('searchExperiments', reqData, token)
    const data = await handleOpenbisResponse<OpenbisCollection[]>(req);
    return data

}

export async function getObjectTypes(token: string): Promise<OpenbisObjectType[]> {
    const reqData = [
        {
            "@id": 0,
            "criteria": [],
            "@type": "as.dto.sample.search.SampleTypeSearchCriteria",
            "operator": "AND"
        },
        {
            "@id": 0,
            "@type": "as.dto.sample.fetchoptions.SampleTypeFetchOptions",
            "sort": null,
            "propertyAssignments": {
                "@type": "as.dto.property.fetchoptions.PropertyAssignmentFetchOptions",
                "propertyType": {
                    "@type": "as.dto.property.fetchoptions.PropertyTypeFetchOptions"
                }
            }
        }
    ];
    const req = openbisRequest('searchSampleTypes', reqData, token);
    const types = await handleOpenbisResponse<OpenbisObjectType[]>(req);
    return types
}


export async function getCollection(token: string, identifier: string, withType: string | null = null, withObjects: boolean = false, startPage: number | null = null, count: number | null, sortBy: string[] | null): Promise<OpenbisCollection> {
    const reqData = [
        {
            identifier: identifier,
            "@type": "as.dto.experiment.id.ExperimentIdentifier"
        },
       new ExperimentFetchOptions(true, new ObjectFetchOptions(true, true, true, startPage, count, withType, sortBy ? new ObjectSortOptions(sortByField(sortBy)) : null), startPage, count)
    ]
    const req = openbisRequest('getExperiments', reqData, token)
    
    const text = await new Response(req.body).text();
    //console.log(text)
    const data = await handleOpenbisResponse<OpenbisCollection>(req);
    const newData = data[identifier] as OpenbisCollection
    if(withType){
        const newSamples = (data[identifier] as OpenbisCollection ).samples.filter((it) => (it.code.includes(withType)))
        newData.samples = newSamples
    }else{
        1
    }
    return newData
}

import * as openbisRequests from "@/openbis/model/utils";
import { JsogService } from "jsog-typescript"
import { JSOGDeserialiser } from "@/openbis/model/utils";
import * as exp from "constants";
import { deserialize } from "v8";
import { FieldSorting } from "@/app/helpers/collectionHelpers";


const jsog = new JsogService();

export function prepareRequest(method: string, params: any[]): openbisRequests.JSONRPCRequest {
    return {
        method: method,
        params: params,
        id: "1",
        jsonrpc: "2.0"

    } as openbisRequests.JSONRPCRequest
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
        const deserializer = new JSOGDeserialiser()
        const bodyContent = (await response?.json())
        const body = bodyContent as openbisRequests.JSONRPCResponse<T>
        return body.result as T
    } else {
        throw new Error(`Error: ${response.status}`);
    }
}

export async function handleOpenbisResponse<T>(req: RequestInfo): Promise<T> {
    const data = openbisRequests.parseOpenbisResponse<T>(await handleRequest<openbisRequests.OpenbisRawResponse<T>>(req))
    const deserializer = new JSOGDeserialiser()
    deserializer.buildCache(data)
    switch (data.kind) {
        case "searchResponse": {return {...deserializer.applyCache(data)} as T}
        case "listResponse": { return deserializer.applyCache(data.objects) as T }
        case "singleResponse": { return data as T }
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

export async function getTree(token: string, getSamples: Boolean = false): Promise<openbisRequests.OpenbisTree> {
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
                "registrator": new openbisRequests.PersonFetchOptions(),
                "@type": "as.dto.space.fetchoptions.SpaceFetchOptions",
                "projects": {
                    "@type": "as.dto.project.fetchoptions.ProjectFetchOptions",
                    "experiments": new openbisRequests.ExperimentFetchOptions(true, getSamples ? new openbisRequests.ObjectFetchOptions(false, false, false) : null)
                },
                "sort": null
            }
        ]
    const req = openbisRequest('searchSpaces', body, token)

    const data = await handleOpenbisResponse<openbisRequests.OpenbisSearchResponse<openbisRequests.OpenbisSpace>>(req);

    const result = {
        spaces: data.objects
    } as openbisRequests.OpenbisTree
    return result

}

export async function getCollections(token: string): Promise<object> {
    const reqData = [
        { "@id": 0, "criteria": [], "operator": "AND", "@type": "as.dto.experiment.search.ExperimentSearchCriteria" },
        new openbisRequests.ExperimentFetchOptions(false, new openbisRequests.ObjectFetchOptions(false, false, null, null))
    ]
    const req = openbisRequest('searchExperiments', reqData, token)
    const data = await handleOpenbisResponse<openbisRequests.OpenbisSearchResponse<openbisRequests.OpenbisCollection>>(req);
    return data.objects

}

export async function getObjectTypes(token: string): Promise<openbisRequests.OpenbisObjectType[]> {
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
        }
    ];
    const req = openbisRequest('searchSampleTypes', reqData, token);
    const types = await handleOpenbisResponse<openbisRequests.OpenbisSearchResponse<openbisRequests.OpenbisObjectType>>(req);
    return types.objects
}


export async function getCollection(token: string, identifier: string, withType: string | null = null, withObjects: boolean = false, startPage: number | null = null, count: number | null, sortBy: FieldSorting[] | null): Promise<openbisRequests.OpenbisCollection> {
    const sorters = sortBy ? sortBy.map((c) => openbisRequests.Sorting.fromFieldSorter(c)) : null
    const reqData = [
        new openbisRequests.SampleSearchCriteria().and(new openbisRequests.ExperimentSearchCriteria().withIdentifier(identifier)).withType(withType),
        new openbisRequests.ObjectFetchOptions(true, true, true, startPage, count, withType, sortBy ? new openbisRequests.ObjectSortOptions(sorters) : null)
    ]
    const req = openbisRequest('searchSamples', reqData, token)

    const text = await new Response(req.body).text();
    const data = await handleOpenbisResponse<openbisRequests.OpenbisSearchResponse<openbisRequests.OpenbisObject>>(req);
    const newData = {identifier: {identifier: identifier} as openbisRequests.Identifier, samples: data.objects, totalCount: data.totalCount} as openbisRequests.OpenbisCollection
    return newData
}
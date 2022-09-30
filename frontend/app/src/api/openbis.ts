

export function prepareRequest(method: string, params: any[]): object {
    return {
        method: method,
        params: params,
        id: "1",
        jsonrpc: "2.0"

    }
}


export function openbisRequest(method: string, params: any[], token?: string): Request {
    const apiEndpoint = '/openbis/'
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
        const body = await response?.json();
        return body?.result
    } else {
        throw new Error(`Error: ${response.status}`);
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
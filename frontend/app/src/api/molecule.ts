
    import { Molecule } from "@/store/molecule";


    export type validMoleculeIdentifiers = 'smiles' | 'iupac_name' | 'formula' | 'stdinchikey' | 'cas' | 'uuuuu' | 'name' | 'cid' | 'inchi'

    export async function getStructure(name: string, outputRepresentation: validMoleculeIdentifiers): Promise<string>{
        const reqBase = new URL(`https://cactus.nci.nih.gov:443/chemical/structure/${encodeURI(name)}/${outputRepresentation}`);
        const req = new Request(reqBase);
        const response = await fetch(req);
        if (!response.ok){
            if (response.status==404){
                const em = `The molecule ${name} does not exist`;
                throw new Error(em);
            } else
            throw new Error(`Response status ${response.statusText}`)
        }
        const data = await response.text();
        return data
    }

    const pubchemEndpoint = "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound"

    export async function  getPubchemId(identifier:string, inputRepresentation: validMoleculeIdentifiers): Promise<integer> {
        const endpoint = new URL(`${pubchemEndpoint}/${inputRepresentation}/${encodeURIComponent(identifier)}/cids/JSON`)
        const req = new Request(endpoint,  {mode: 'cors'});
        const response = await fetch(req);
        if (!response.ok){
            if (response.status==404){
                const em = `The molecule ${name} does not exist`;
                throw new Error(em);
            } else
            throw new Error(`Response status ${response.statusText}`)
        }
        const data = await response.json();
        return data?.IdentifierList?.CID[0]
    }

    export async function pubChemLCSS(cid: number){
        const endpoint = new URL(`https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/JSON?`)
        const params = new URLSearchParams()
        params.append('toc', 'LCSS TOC')
        params.append('heading', 'GHS Classification')
        const req = new Request(endpoint + params.toString(), {mode: 'cors'});
        const response = await fetch(req);
        if (!response.ok){
            if (response.status==404){
                const em = `The molecule with CID ${cid} does not exist`;
                throw new Error(em);
            } else
            throw new Error(`Response status ${response.statusText}`)
        }
        const data = await response.json();

    }
    export async function getMoleculeIdentifier(name:string): Promise<Molecule>{
        const iupac_name = await getStructure(name, 'iupac_name');
        const smiles = await getStructure(name, 'smiles');
        const formula = await getStructure(name, 'formula');
        const cas = await getStructure(name, "cas");
        // Get mol file 
        const jme = await getStructure(name, 'file?format=mol');
        const inchi = await getStructure(name, 'inchi');
        return {
            iupacName: iupac_name,
            inChi: inchi,
            smiles: smiles,
            formula: formula,
            cas: cas,
            jme: jme
        } as Molecule
    }
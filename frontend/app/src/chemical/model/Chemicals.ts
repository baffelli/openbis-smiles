export interface Molecule {
    iupacName: string;
    cas: string;
    inChi: string;
    smiles: string | null;
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

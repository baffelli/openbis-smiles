import { defineStore } from 'pinia'
import * as Mol from '../api/molecule';



export interface Molecule {
    name: string,
    iupacName: string,
    id: string,
    sid: number | null,
    cas: string,
    jme: string,
    formula: string,
    smiles: string,
    hazardous: boolean | null,
    hazardouseSpec: string[] | null,
    supplier: string | null,
    synthBy: string | null,
    comments: string | null,
    receivingDate: Date | null
}

interface Getters {}

interface Actions {
   populate(name: string, type: string),
   generateFromIdentifier(identifier: string, type:string)
}

const identifierMapper = {
    name: 'iupac_name',
    smiles: 'smiles',
    formula: 'formula',
    cas: 'cas'
}

export const useMolecule = defineStore<string, Molecule,  Getters, Actions>(
    "molecule",
    {
        state: (): Molecule => {
            return {
                name: '',
                sid: null,
                iupacName: '',
                id: '',
                cas: '',
                formula: '',
                smiles: '',
                jme: '',
                hazardous: false,
                hazardouseSpec: [''],
                supplier: '',
                synthBy: '',
                comments: '',
                receivingDate: null
            } as Molecule
        },
        actions:
        {
            async populate(name: string, type: string){
                const val = await Mol.getPubchemId(name, type)
                const lcss = await Mol.pubChemLCSS(val)
                this.cid = val;
                debugger
                // const val = await Mol.getMoleculeIdentifier(name)
                // if type !== name()
                // this.name = this.name;
                // this.iupacName = val.iupacName;
                // this.cas = val.cas;
                // this.smiles = val.smiles;
                // this.formula = val.formula;
                // this.jme = val.jme;
            },
            async generateFromIdentifier(identifier: string, type: string){
                const iupacName = await Mol.getStructure(identifier, 'iupac_name')
            }
        }
    }

)
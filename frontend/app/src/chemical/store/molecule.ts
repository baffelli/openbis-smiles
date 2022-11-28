import { defineStore } from 'pinia'
import * as Mol from '../service/molecule';
import { Molecule } from '../model/Chemicals';

export interface Product{
    name: String
    cas: String
    articleNumber: String
    quantity: String
    purity: String
    location: String
    supplier: String
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

export interface State{
    molecule: Molecule
}


export const useMolecule = defineStore<string, State,  Getters, Actions>(
    "molecule",
    {
        state: (): State => {
            return {molecule:{
                name: '',
                iupacName: '',
                cas: '',
                inChi: '',
                smiles: ''
            } as Molecule} as State
        },
        actions:
        {
            async populate(name: string, type: string){
                const val = await Mol.getMoleculeIdentifier(name)
                if (type !== "name"){
                    this.name = this.name;
                }
                const mol = {
                    iupacName : val.iupacName,
                    cas: val.cas,
                    smiles: val.smiles
                }
                this.molecule = mol 
            },
            async generateFromIdentifier(identifier: string, type: string){
                const iupacName = await Mol.getStructure(identifier, 'iupac_name')
            }
        }
    }

)
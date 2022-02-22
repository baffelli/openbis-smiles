define("lib", ["openbis-functions"],
function(openbis){

    async function getStructure(name, type='iupac_name'){
        let nm = encodeURIComponent(name)
        let response = await fetch(`https://cactus.nci.nih.gov:443/chemical/structure/${nm}/${type}`);
        if (!response.ok){
            if (response.status==404){
                let em = `The molecule ${name} does not exist`;
                throw new Error(em);
            } else
            throw new Error(`Response status ${response.statusText}`)
        }
        let data = await response.text();
        return data
    }
    
    function setError(element, message, color='red'){
        element.textContent = message;
        element.style.color = color;
    }
    
    function resetError(element){
        element.textContent = '';
    }
    
    function drawSmiles(smiles, jmse){
        jmse.readMolFile(smiles);
    }
    
    function randomID(iupac){
        nm = Math.floor(Math.random()*10);
        return `${iupac}${nm}`
    }
    
    async function populateFields(object, name_output, smiles_output, formula_output, cas_output, jmseApplet){
        let mol = Object.values(object)[0]
        let name = mol.properties['MOLECULE.IUPAC'];
        let identifiers = await getMoleculeIdentifier(name)
        name_output.value = identifiers.IUPAC;
        smiles_output.value = identifiers.SMILES;
        formula_output.value = identifiers.FORMULA;
        cas_output.value = identifiers.CAS;
        drawSmiles(identifiers.JME, jmseApplet);
    }

    async function getMoleculeIdentifier(name){
        let iupac_name = await getStructure(name, 'iupac_name');
        let smiles = await getStructure(name, 'smiles');
        let formula = await getStructure(name, 'formula');
        let cas = await getStructure(name, 'CAS');
        // Get mol file 
        let jme = await getStructure(name, 'file?format=mol');
        return {
            IUPAC: iupac_name,
            SMILES: smiles,
            FORMULA: formula,
            CAS: cas,
            JME: jme

        }
    }
    
    async function getStructureAndPoulateFields(api, selection, jmse){
        let prop = await openbis.getMolecule(api, selection.target.value);
        let smiles_output = document.getElementById("smiles-output");
        let formula_output = document.getElementById('chemical-formula');
        let name_output = document.getElementById("molecule-name");
        let cas_output = document.getElementById("cas-number");
        await populateFields(prop, name_output, smiles_output, formula_output, cas_output, jmse);
    }
    
    async function generateFromName(api, name, error){
        //Validate the name
        let validated_name = await getStructure(name.value, 'iupac_name');
        let identifiers = getMoleculeIdentifier(validated_name);
        console.log("Validated");
        setError(error, `Official IUPAC Name: ${validated_name}`, 'green');
        //Create the molecule
        openbis.createMolecule(api, identifiers);
        //Get properties
        
    }

    function populateSelector(api, selector){
        openbis.findAllMolecules(api).done(function(result) 
                {result.getObjects().forEach(res =>{listMolecules(res, selector);});})
    }


    function listMolecules(result, selector){
        var option = document.createElement("option");
        option.text = `${result.permId}: ${result.properties["MOLECULE.IUPAC"]}`;
        option.value = result.permId
        selector.add(option);
    }

    function saveOrCancel(button){
        if(button.textContent = 'Draw Molecule'){
            button.textContent = 'Cancel'
        }else{
            button.textContent = 'Draw Molecule'
        }
    }

    function changeDrawMode(draw_button, save_button, jme, state){
        console.log(state)
        if(state){
            
            save_button.hidden = "hidden";
            jme.options('depict');

        }else{
            save_button.hidden = "";
            jme.options('nodepict');
        }
        saveOrCancel(draw_button);
        state = !state
        console.log(state)
        return state
    }

    async function saveMolecule(smiles, api){
        let name = await getStructure(smiles, "iupac_name")
        console.log(name)
        permid = openbis.createMolecule(api, {IUPAC:name,
        });
        

    }

    return {
        generateFromName: generateFromName,
        getStructureAndPoulateFields: getStructureAndPoulateFields,
        populateFields: populateFields,
        drawSmiles: drawSmiles,
        resetError: resetError,
        setError: setError,
        getStructure: getStructure,
        populateSelector: populateSelector,
        listMolecules: listMolecules,
        changeDrawMode: changeDrawMode,
        saveMolecule: saveMolecule,
        getMoleculeIdentifier: getMoleculeIdentifier,
        randomID: randomID
    }
    

        
})
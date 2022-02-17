define("lib", ["openbis-functions"],
function(openbis){

    async function getStructure(name, type='iupac_name'){
        let response = await fetch(`https://cactus.nci.nih.gov:443/chemical/structure/${name}/${type}`);
        let error = document.getElementById("error");
        if (!response.ok){
            if (response.status==500){
                let em = `The molecule ${name} does not exist`;
                setError(error, em);
                throw new Error(em);
            } else
            throw new Error(`Response status ${response.statusText}`)
        }
        resetError(error);
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
        debugger;
        jmse.readMolFile(smiles);
    }
    
    
    
    async function populateFields(object, name_output, smiles_output, formula_output, cas_output, jmse){
        let mol = Object.values(object)[0]
        let name = mol.properties['MOLECULE.IUPAC'];
        name_output.value = name;
        let smiles = await getStructure(name, 'SMILES');
        let formula = await getStructure(name, 'formula');
        let cas = await getStructure(name, 'cas');
        // Get mol file 
        let jme = await getStructure(name, 'file?format=mol');
        smiles_output.value = smiles;
        formula_output.value = formula;
        cas_output.value = cas;
        drawSmiles(jme, jmse);
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
        console.log("Validated");
        setError(error, `Official IUPAC Name: ${validated_name}`, 'green');
        //Create the molecule
        openbis.createMolecule(api, {IUPAC:validated_name});
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
        saveMolecule: saveMolecule
    }
    

        
})
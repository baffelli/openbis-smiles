define("openbis-functions", ["as/dto/sample/update/SampleUpdate", "as/dto/sample/id/SampleIdentifier",
"as/dto/experiment/id/ExperimentIdentifier", "as/dto/sample/id/SamplePermId", 
"as/dto/sample/fetchoptions/SampleFetchOptions",  "as/dto/sample/search/SampleSearchCriteria",
"as/dto/global/search/GlobalSearchObjectKind", "as/dto/global/search/GlobalSearchCriteria", 
"as/dto/global/fetchoptions/GlobalSearchObjectFetchOptions",  "as/dto/sample/create/SampleCreation",
"as/dto/entitytype/id/EntityTypePermId", "as/dto/space/id/SpacePermId"]
, 
function(SampleUpdate, SampleIdentifier, ExperimentIdentifier, SamplePermId, SampleFetchOptions, SampleSearchCriteria, GlobalSearchObjectKind, GlobalSearchCriteria,
    GlobalSearchObjectFetchOptions, SampleCreation, EntityTypePermId, SpacePermId){
        

        function findAllMolecules(session){
            var criteria = new  SampleSearchCriteria();
            criteria.withCode().thatContains('MOL');
            var fetchOptions = new SampleFetchOptions();
            fetchOptions.withProperties();
            return session.searchSamples(criteria, fetchOptions);
        }
        
        
        async function getMolecule(session, permID){
            var id3 = new SamplePermId(permID); 
            var fetchOptions = new SampleFetchOptions();
            fetchOptions.withProperties();
            let mol = await session.getSamples([id3], fetchOptions);
            return mol
        }


        async function searchProperties(session, property, value){
            var criteria = new  SampleSearchCriteria();
            criteria.withProperty(property).thatContains(value);
            criteria.withCode().thatContains('MOL');
            var fetchOptions = new SampleFetchOptions();
            fetchOptions.withProperties();
            samples = await session.searchSamples(criteria, fetchOptions);
            return samples;
        }

        async function updateMolecule(session, permID, properties){
            var id3 = new SamplePermId(permID); 
            var sample = new SampleUpdate();
            sample.setSampleId(id3);

  
            Object.entries(properties).forEach(item => {
                sample.setProperty(generatePropertyName(item[0]), item[1]);
              });
            debugger;
            await session.updateSamples([sample]);
        }
        

        function generatePropertyName(name, prefix='MOLECULE'){
            return `${prefix}.${name.toUpperCase()}`
        }

        async function createMolecule(session, properties){
            var sample = new SampleCreation();
            sp = 'LAB503_MATERIALS'
            sample.setTypeId(new EntityTypePermId("MOLECULE"));
            sample.setSpaceId(new SpacePermId(`/${sp}`));
            sample.setExperimentId(new ExperimentIdentifier(`/${sp}/MAT/MAT_EXP_4`));
            //Save all properties
            Object.entries(properties).map(item => {
                sample.setProperty(generatePropertyName(item[0]), item[1]);
              })
            try{
                moleculeID = await session.createSamples([ sample ]);
                return moleculeID
            }
            catch(e){
                console.log(e);
            }

        }
        
        return {
            findAllMolecules: findAllMolecules,
            getMolecule: getMolecule,
            createMolecule: createMolecule,
            updateMolecule: updateMolecule,
            searchProperties: searchProperties
        };
        
        
    });
define("openbis-functions", ["as/dto/sample/update/SampleUpdate", "as/dto/sample/id/SampleIdentifier",
"as/dto/experiment/id/ExperimentIdentifier", "as/dto/sample/id/SamplePermId", 
"as/dto/sample/fetchoptions/SampleFetchOptions",  "as/dto/sample/search/SampleSearchCriteria",
"as/dto/global/search/GlobalSearchObjectKind", "as/dto/global/search/GlobalSearchCriteria", 
"as/dto/global/fetchoptions/GlobalSearchObjectFetchOptions",  "as/dto/sample/create/SampleCreation",
"as/dto/entitytype/id/EntityTypePermId", "as/dto/space/id/SpacePermId"
], 
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
        
        async function createMolecule(session, properties){
            var sample = new SampleCreation();
            sample.setTypeId(new EntityTypePermId("MOLECULE"));
            sample.setSpaceId(new SpacePermId("LAB503_MATERIALS"));
            //Save all properties
            Object.entries(properties).map(item => {
                sample.setProperty(`MOLECULE.${item[0].toUpperCase()}`, item[1]);
              })
            await session.createSamples([ sample ]).done(function(permIds) {
                alert("Perm ids: " + JSON.stringify(permIds));
                return permIds
            });
            return permIds
        }
        
        return {
            findAllMolecules: findAllMolecules,
            getMolecule: getMolecule,
            createMolecule: createMolecule
        };
        
        
    });
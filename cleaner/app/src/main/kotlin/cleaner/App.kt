/*
 * This Kotlin source file was generated by the Gradle 'init' task.
 */
package cleaner.app


import java.net.URI;

import ch.ethz.sis.openbis.generic.asapi.v3.IApplicationServerApi
import ch.systemsx.cisd.common.spring.HttpInvokerUtils
import ch.ethz.sis.openbis.generic.asapi.v3.dto.sample.Sample
import ch.ethz.sis.openbis.generic.asapi.v3.dto.sample.SampleType
import ch.ethz.sis.openbis.generic.asapi.v3.dto.sample.fetchoptions.SampleFetchOptions
import ch.ethz.sis.openbis.generic.asapi.v3.dto.sample.search.SampleSearchCriteria
import cleaner.chemicals.SourceMolecule
import cleaner.chemicals.cleanSourceMolecule
import cleaner.io.*
import cleaner.logging.AppLogger
import cleaner.openbis.*
import org.slf4j.LoggerFactory
import kotlinx.cli.*
import kotlinx.serialization.json.Json
import kotlinx.serialization.decodeFromString
import org.jetbrains.exposed.sql.Database
import org.jetbrains.kotlinx.dataframe.api.cast
import org.jetbrains.kotlinx.dataframe.api.map
import org.jetbrains.kotlinx.dataframe.api.toList
import org.jetbrains.kotlinx.dataframe.api.toMap
import org.jetbrains.kotlinx.dataframe.size
import java.io.File

val a = Sample()
enum class CommandLineModes(val type: String) {
    OPENBIS("openbis"),
    FILE("file")
}

fun initialiseDb(file: String): Database {
    return cleaner.io.getDb(file)
}


fun main(args: Array<String>) {
    println(args.asList())
    val parser = ArgParser("chemicals cleaner")
    val inputChemicals by parser.argument(ArgType.String, description = "Input chemicals")
    val chemicalConfig by parser.argument(ArgType.String, description = "Molecule mapping")
    val nci by parser.argument(
        ArgType.String,
        description = "ChEBI Database in SDF Format (See: https://cactus.nci.nih.gov/download/nci/#release-4)"
    )
    val dbFile by parser.argument(ArgType.String, description = "Path to SQLLite database")
    val outConfig by parser.argument(ArgType.String, description = "JSON file of output field configuration")
    val collectionIdentifier by parser.argument(ArgType.String, description = "Output collection identifier")
    val reimportDB by parser.option(ArgType.Boolean, "reimport", description = "Force reimport database").default(false)
    val openbisHost by parser.option(ArgType.String, "url", description = "Openbis URL")
        .default("https://localhost:8445/openbis/openbis")
    val openbisUser by parser.option(ArgType.String, "user", description = "Openbis Username").default("admin")
    val openbisPassword by parser.option(ArgType.String, "password", description = "Openbis Username")
        .default("changeit")
    parser.parse(args)
    //Initialise Logger
    val log by AppLogger.logger {}
    log.info("Starting SQLLite DB")
    //Initialise SQL Lite db
    val db = initialiseDb(dbFile)
    log.info("DB started in ${db.url}")
    val chemicalsDbAvailable = checkChemicals(db)
    if (!chemicalsDbAvailable || reimportDB) {
        log.info("Chemicals DB not initialised or reimport required")
        createChemicals(db)
        log.info("Chemicals DB initialised")
        log.info("Loading chemicals from SDF into SQLite database ${db.url}")
        sdfToSQL(nci, db, ChemicalsSource.CHEBI)
        log.info("Finished loading chemicals into SQLite database")
    }
    log.info("Processing input chemicals")
    val mapping = Json.decodeFromString<OpenbisPropertyMapping>(File(chemicalConfig).readText())
    log.info("${mapping}")
    log.info("${mapping.fields}")
    val mappedColl = getValuesFromFile<SourceMolecule>(File(inputChemicals), mapping).map { SourceMolecule(it.toMap()) }
    log.info("${mappedColl.size} chemicals to process")
    val products = cleanSourceMolecule(db, mappedColl)
    log.info("${products.size} products remaining after processing")
    log.info("Storing products on OpenBIS")
    //Connect to Openbis
    val openBis = createOpenbisInstance(URI(openbisHost))
    val token = openBis.login(openbisUser, openbisPassword)
    //Clean collection
    clearCollection(openBis, token, collectionIdentifier)
    //Read output configuration
    val outputMapping = Json.decodeFromString<OpenbisSampleMapping>(File(outConfig).readText())
    val productMapping = outputMapping.getMapping("PRODUCT")!!
    val moleculeMapping = outputMapping.getMapping("MOLECULE")!!
    val creation = products.map { it to addDataClassToCollection(collectionIdentifier, productMapping, it) }
        .associate { (k, v) -> k to v }
    // TODO improve creation of children
    //Create Products
    val created = fillCollection(
        URI(openbisHost),
        token,
        collectionIdentifier,
        creation)
    //Create molecules
    val childrenCreation = created.asSequence().mapNotNull { (product, permID) ->
        val mol = product.molecule?.get(0)
        val creation = mol?.let { addDataClassToCollection(collectionIdentifier, moleculeMapping, it) }?.apply {
            childIds = listOf(permID)
        }
        if(mol != null && creation != null) (mol to creation) else null
    }.associate { (k,v) -> k to v }
    fillCollection(URI(openbisHost), token, collectionIdentifier, childrenCreation)

    println(created)
}

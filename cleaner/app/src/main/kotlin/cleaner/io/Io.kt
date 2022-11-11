package cleaner.io

import cleaner.chemicals.CAS
import cleaner.openbis.OpenbisPropertyMapping
import com.actelion.research.chem.io.SDFileParser
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.kotlinx.dataframe.DataFrame
import org.jetbrains.kotlinx.dataframe.api.into
import org.jetbrains.kotlinx.dataframe.api.rename
import org.jetbrains.kotlinx.dataframe.api.select
import org.jetbrains.kotlinx.dataframe.io.readTSV
import org.jetbrains.kotlinx.dataframe.name
import org.slf4j.LoggerFactory
import java.io.BufferedReader
import java.io.File
import java.io.FileReader
import java.nio.charset.StandardCharsets


import cleaner.io.Chemical
import org.jetbrains.exposed.sql.batchInsert
import org.jetbrains.kotlinx.dataframe.impl.asList

//@OptIn(ExperimentalSerializationApi::class)
//fun getMoleculesFromOpenbis(
//    url: String,
//    username: String,
//    password: String,
//    collection: String,
//    mapping: String
//): List<SourceMolecule> {
//    val openbis = createOpenbisInstance(URI(url))
//    val token = openbis.login(username, password)
//    val coll = getObjectsInCollection(token, openbis, collection)
//    val objectConfig = Json.decodeFromString<OpenbisPropertyMapping>(File(mapping).readText())
//    return coll.map { it -> SourceMolecule(objectConfig.mapSamples(it)) }
//}

fun getMoleculesFromFile(file: File, mapping: OpenbisPropertyMapping): DataFrame<*> {
    val nameMapping = mapping.fields
    val df = DataFrame.readTSV(file, charset = StandardCharsets.UTF_16)
    return df.select { cols { nameMapping.containsKey(it.name) } }
        .rename { cols { nameMapping.containsKey(it.name) } }
        .into { nameMapping.getOrDefault(it.name, "test") }

}

fun SDFileParser.getFieldByName(name: String): String? {
    val idx = this.getFieldIndex(name)
    val res = if (idx >= 0) {
        val dt = this.getFieldData(idx)
        dt
    } else {
        null
    }
    return res
}


fun SDFileParser.getFieldsByName(names: List<String>): Map<String, String?> {
    return names.associateWith { this.getFieldByName(it) }
}


operator fun SDFileParser.iterator(): Iterator<SDFileParser> {
    return object : Iterator<SDFileParser> {
        val cur = 0;
        override fun hasNext(): Boolean = this@iterator.next()
        override fun next(): SDFileParser {
            this@iterator.next();
            return this@iterator
        }
    }
}

/***
 * Iterate over a SDF file in batches
 * and get the chosen fields
 */
fun SDFileParser.batchedIterator(fields: List<String>, batch: Int = 100): Iterator<List<Map<String, String?>>> {
    return object : Iterator<List<Map<String, String?>>> {
        override fun next(): List<Map<String, String?>> {
            val res = listOf<Map<String, String?>>().toMutableList()
            (1..batch).forEach {
                if (this@batchedIterator.next()) {
                    val values = this@batchedIterator.getFieldsByName(fields)
                    res.add(values)
                }
            }
            return res.toList()
        }

        override fun hasNext(): Boolean = this@batchedIterator.next()

    }
}

/**
 * Safely opens a SDF File
 */
fun openSDF(name: String, fn: List<String>?): SDFileParser {
    var fileParser = SDFileParser(name)
    val fnOut = fn?.toTypedArray() ?: fileParser.fieldNames
    fileParser.close()
    return SDFileParser(name, fnOut)
}


fun <R> SDFileParser.use(code: ((SDFileParser) -> R)): R {
    val res = code(this)
    this.close()
    return res
}


val ChEBIFields =
    mapOf("CAS Registry Numbers" to "cas", "ChEBI Name" to "chEBIName", "InChIKey" to "inchiKey", "InChI" to "inchi", "IUPAC Names" to "iupacName", "Formulae" to "formula")
private val NCIFields = mapOf<String, String>(
    "CAS" to "cas",
    "Standard InChi" to "inchi",
    "Standard InChIKey" to "inchiKey",
    "DTP names" to "name",
    "Formula" to "formula"
)

/**
 * Data class representing an NCI database entry
 */
data class NCIEntry(val vals: Map<String, String>) {
    private val newNames = vals.mapKeys { (k, v) -> NCIFields.get(k) }
    val CAS: String by newNames
    val inchiKey: String by newNames
    val names: String by newNames
    val formula: String by newNames
}


data class ChEBIChemical(
    val CAS: CAS,
    val iupacName: String,
    val formula: String,
    val inchiKey: String,
    val inchi: String
)

/**
 * Represents a ChEBI entry
 */
data class ChEBIEntry(
    val vals: Map<String, String?>
) {
    private val newVals = vals.mapKeys { (k, v) -> ChEBIFields.get(k) }.mapValues{ (k, v) -> v?.split("\n") }
    val cas: List<String> by newVals
    val inchiKey: List<String> by newVals
    val inchi: List<String> by newVals
    val iupacName: List<String> by newVals
    val formula: List<String> by newVals
}





/**
 * Iterates over a SDF file and stores the data
 * in a SQLLIte database
 */
fun sdfToSQL(sdfPath: String, db: Database, batchSize: Int = 1000): Unit {
    val logger = LoggerFactory.getLogger("SQL")
    val fields = ChEBIFields.keys.asList()
    openSDF(sdfPath, fields).use { sdf ->

        logger.info("Available fields ${sdf.fieldNames.toList()}")
        transaction(db) {
            for ((index, batch) in sdf.batchedIterator(fields, batchSize).withIndex()) {
                //Discard compounds without CAS Entry
                val entries = batch.filter { it.values.all { it != null } }.map {
                    val compound = ChEBIEntry(it)
                    val spread = (compound.cas zip compound.iupacName).map { (cas, iupac) ->
                        CAS.fromString(cas)?.let { validCas ->
                            ChEBIChemical(validCas, iupac, compound.formula[0], compound.inchiKey[0], compound.inchi[0])
                        }
                    }.filterNotNull()
                    spread
                }.flatMap { it }
                Chemical.batchInsert(entries, ignore = true) { entry ->
                    this[Chemical.cas] = entry.CAS.toCASString()
                    this[Chemical.inchiKey] = entry.inchiKey
                    this[Chemical.inchi] = entry.inchi
                    this[Chemical.iupacName] = entry.iupacName
                    this[Chemical.formula] = entry.formula
                }
                logger.info("Processing Batch ${index} with size ${batch.size}")
            }
        }
    }
}

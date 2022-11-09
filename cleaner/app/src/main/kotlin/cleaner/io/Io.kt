package cleaner.io

import cleaner.app.createOpenbisInstance
import cleaner.app.getObjectsInCollection
import cleaner.chemicals.SourceMolecule
import cleaner.openbis.OpenbisPropertyMapping
import com.actelion.research.chem.io.SDFileParser
import io.ktor.utils.io.core.*
import kotlinx.serialization.json.Json
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.batchInsert
import org.jetbrains.exposed.sql.insertIgnore
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.kotlinx.dataframe.DataFrame
import org.jetbrains.kotlinx.dataframe.api.into
import org.jetbrains.kotlinx.dataframe.api.rename
import org.jetbrains.kotlinx.dataframe.api.select
import org.jetbrains.kotlinx.dataframe.io.readTSV
import org.jetbrains.kotlinx.dataframe.name
import org.slf4j.LoggerFactory
import java.io.File
import java.net.URI
import java.nio.charset.StandardCharsets

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
    val res = if (idx > 0) {
        this.getFieldData(idx)
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

fun SDFileParser.batchedIterator(fields: List<String>, batch: Int = 100): Iterator<List<Map<String, String?>>> {
    return object : Iterator<List<Map<String, String?>>> {

        override fun next(): List<Map<String, String?>> {
            val batch = (1..batch).map {
                val res = this@batchedIterator.getFieldsByName(fields)
                this@batchedIterator.next()
                res
            }
            return batch
        }

        override fun hasNext(): Boolean = this@batchedIterator.next()

    }
}

/**
 * Safely opens a SDF File
 */
fun openSDF(name: String): SDFileParser {
    var fileParser = SDFileParser(name)
    val fn = fileParser.getFieldNames()
    fileParser.close()
    return SDFileParser(name, fn)
}


fun  <R> SDFileParser.use(code: ((SDFileParser) -> R) ): R{
    val res = code(this)
    this.close()
    return res
}



/**
 * Data class representing an NCI database entry
 */
data class NCIEntry(val CAS: String, val inChI: String, val names: String)

/**
 * Iterates over a SDF file and stores the data
 * in a SQLLIte database
 */
fun sdfToSQL(sdf: SDFileParser, db: Database, maxRow: Int? = null): Unit {
    val logger = LoggerFactory.getLogger("SQL")
    transaction(db) {
        for ((index, batch) in sdf.batchedIterator(listOf("CAS", "Standard InChI", "DTP names"), 10000).withIndex()) {
            logger.info("Processing Batch ${index} with size ${batch.size}")
            val nciEntries = batch.filter {
                it.get("CAS") != null
            }.map {
                NCIEntry(
                    it.get("CAS").toString(),
                    it.get("Standard InChI").toString(),
                    it.get("DTP names").toString().split("\n")[0]
                )
            }
            Chemical.batchInsert(nciEntries, ignore = true) { entry ->
                this[Chemical.cas] = entry.CAS
                this[Chemical.inChi] = entry.inChI
                this[Chemical.iupacName] = entry.names
            }
        }
    }
}

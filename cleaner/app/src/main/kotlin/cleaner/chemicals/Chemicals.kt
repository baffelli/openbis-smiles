package cleaner.chemicals

import ch.ethz.sis.openbis.generic.asapi.v3.IApplicationServerApi
import ch.ethz.sis.openbis.generic.asapi.v3.dto.entitytype.id.EntityTypePermId
import ch.ethz.sis.openbis.generic.asapi.v3.dto.sample.SampleType
import ch.ethz.sis.openbis.generic.asapi.v3.dto.sample.create.SampleCreation
import cleaner.io.Chemical
import cleaner.logging.AppLogger
import cleaner.openbis.OpenBISStorable
import cleaner.openbis.OpenbisPropertyMapping
import java.time.LocalDateTime;
import kotlinx.serialization.Serializable
import kotlinx.serialization.properties.*

import io.ktor.client.HttpClient
import io.ktor.client.call.*
import io.ktor.client.engine.cio.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.client.plugins.*
import io.ktor.http.HttpStatusCode
import io.ktor.client.plugins.HttpRequestTimeoutException

import io.ktor.http.*
import java.net.URI
import java.net.URLEncoder
import kotlinx.coroutines.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import java.lang.IllegalArgumentException
import kotlinx.serialization.*
import kotlinx.serialization.Transient
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.*
import org.jetbrains.exposed.sql.transactions.experimental.suspendedTransactionAsync
import org.slf4j.LoggerFactory
import java.lang.Thread.*
import kotlin.properties.ReadOnlyProperty
import kotlin.reflect.KProperty


/***
 * Serialiser for the CAS type
 */
object CASAstringSerializer : KSerializer<CAS> {
    override val descriptor: SerialDescriptor = PrimitiveSerialDescriptor("CAS", PrimitiveKind.STRING)

    override fun serialize(encoder: Encoder, value: CAS) {
        val string = value.toCASString()
        encoder.encodeString(string)
    }

    override fun deserialize(decoder: Decoder): CAS {
        val string = decoder.decodeString()
        return CAS.fromString(string)!!
    }
}


@Serializable(with = CASAstringSerializer::class)
data class CAS(val first: String, val middle: String, val checksum: String) {
    init {
        val computedChecksun = checksumCAS(first + middle)
        val checksumNumber = checksum.toInt()
        require(computedChecksun == checksumNumber) {
            "CAS Checksum invalid: ${computedChecksun} != ${checksumNumber} for CAS ${first}-${middle}-${checksum}"
        }
    }

    fun toCASString(): String {
        return "${first}-${middle}-${checksum}"
    }

    companion object {
        fun fromString(cas: String): CAS? {
            return if (checkCASPattern(cas)) {
                val components = splitCAS(cas)
                try {
                    val cas1 = CAS(components[0], components[1], components[2])
                    cas1
                } catch (e: IllegalArgumentException) {
                    return null
                }
            } else {
                null
            }
        }
    }
}

/**
 * Parses a string into a CAS Number
 *
 * @param input the string to parse
 *
 * @return The parsed string as a CAS object (an alias to a string)
 *
 */
private fun validateCAS(input: String): Boolean {
    return try {
        CAS.fromString(input)
        true
    } catch (e: Exception) {
        false
    }
}

private val casPattern = Regex("(\\d{2,7})[-_\\.]?(\\d{2})[-_\\.]?(\\d{1})")

/** Checks whether the given string conforms to the pattern for CAS numbers
 *
 * @param input the string to check
 *
 * @return True if the format is valid, false otherwise
 *
 */
private fun checkCASPattern(input: String): Boolean {
    val pattern = casPattern
    return pattern.find(input) != null
}

/**
 * Split a CAS into the various components
 *
 * @param input CAS string
 *
 * @return the component of the CAS number without the separator
 *
 */
private fun splitCAS(input: String): List<String> {
    val els = casPattern.find(input)
    if (els!!.groups.size == 4) {
        return els.groupValues.subList(1, 4)
    } else {
        throw Exception("String does not conform to CAS pattern")
    }
}

/** Computes the checksum for a CAS number */
private fun checksumCAS(input: String): Int {
    return input.toCharArray()
        .reversedArray()
        .mapIndexed { index, char -> Character.getNumericValue(char) * (index + 1) }
        .sum()
        .mod(10)
}

/***
 * Sealed class that represents objects
 * that can be stored in openBIS
 */
@Serializable
sealed class OpenBISRepresentable : OpenBISStorable {

    fun toMap(): Map<String?, String> {
        return Properties.encodeToMap(this).map { (k, v) -> k to v.toString() }.associate { (k, v) -> k to v }
    }

    override fun toSampleCreation(mapping: OpenbisPropertyMapping): SampleCreation {
        val sampleType = SampleType().apply { permId = EntityTypePermId(mapping.type) }
        val creation = SampleCreation()
        val props = toMap() as Map<String, String>
        val fields = mapping.reverseMap().transformMap(props)
        creation.apply {
            typeId = sampleType.permId
            properties = fields
        }
        return creation
    }
}

/**
 * Represents an (abstract molecule)
 */
@Serializable
data class Molecule(val iupacName: String, val cas: CAS, val inChi: String?) : OpenBISRepresentable()


/**
 * Represent a concrete product (poentially derived from a molecule)
 * As a product is messier than a molecule, many fields are optional,
 * such as the CAS registry number and the link to a Molecule.
 */
@Serializable
data class Product(
    val name: String,
    val CAS: CAS?,
    val supplier: String?,
    val articleNumber: String?,
    val purity: String?,
    val quantity: String?,
    val location: String?,
    val molecule: List<Molecule>?
) : OpenBISRepresentable(){
    fun dropMolecule(): Product{
        return Product(name, CAS, supplier, articleNumber, purity, quantity, location, null)
    }
}



@Serializable
sealed class FieldValue(){
    class IntValue(val c: Int): FieldValue()
    class StringValue(val c: String): FieldValue()
    class BoolValue(val c: Boolean): FieldValue()
    class LocalDateTimeValue(val c: LocalDateTime): FieldValue()
    class NullValue(): FieldValue()

    companion object{
        fun read(values: Any?): FieldValue{
            val res = when(values){
                is Int -> IntValue(values)
                is String -> StringValue(values)
                is Boolean -> BoolValue(values)
                is LocalDateTime -> LocalDateTimeValue(values)
                else -> NullValue()
            }
            return res
        }
    }
}


fun <K>fieldValueProperty(map: Map<String, Any?>): ReadOnlyProperty<Any, K?> {
    return object : ReadOnlyProperty<Any, K?> {
        override fun getValue(thisRef: Any, property: KProperty<*>): K? {
            val res = map[property.name]
            val value = when(res){
                is FieldValue.IntValue -> res.c
                is FieldValue.StringValue -> res.c
                is FieldValue.BoolValue ->  res.c
                is FieldValue.LocalDateTimeValue -> res.c
                is FieldValue.NullValue -> null
                else -> throw  Exception("Not possible")
            } as? K
            return value
        }
    }

}
/**
 * Represent a molecule as it is stored in the source openbis
 * instance
 */
@Serializable
data class SourceMolecule( val values: Map<String, @Contextual Any?>) {
    @Transient private val defaultMap = values.map{ (k, v) -> k to FieldValue.read(v) }.associate { (k,v) -> k to v }
    val name: String? by fieldValueProperty(defaultMap)
    val formula: String? by fieldValueProperty(defaultMap)
    val cas: String? by fieldValueProperty(defaultMap)
    val supplier: String? by fieldValueProperty(defaultMap)
    val articleNumber: String? by fieldValueProperty(defaultMap)
    val lotNumber: String? by fieldValueProperty(defaultMap)
    val purity: String? by fieldValueProperty(defaultMap)
    val packageSize: String? by fieldValueProperty(defaultMap)
    val storageConditions: String? by fieldValueProperty(defaultMap)
    val laboratory: String? by fieldValueProperty(defaultMap)
    val whoOrdered: String? by fieldValueProperty(defaultMap)
    val orderDate: LocalDateTime? by fieldValueProperty(defaultMap)
    val location: String? by fieldValueProperty(defaultMap)
    val available: Boolean? by fieldValueProperty(defaultMap)
    val reference: String? by fieldValueProperty(defaultMap)
    val publication: String? by fieldValueProperty(defaultMap)
    val notes: String? by fieldValueProperty(defaultMap)
}




/**
 * Represents the response of the CAS registry service
 */
@Serializable
sealed class CASResponse {
    @Serializable
    @SerialName("casentry")
    data class CASEntry(
        val uri: String,
        val rn: String,
        val name: String,
        val image: String,
        val inchi: String,
        val inchiKey: String,
        val smile: String,
        val canonicalSmile: String,
        val molecularFormula: String,
        val synonyms: List<String>
    ) : CASResponse()

    @Serializable
    @SerialName("caserror")
    data class CASError(val message: String) : CASResponse()
}

object CASSerializer : JsonContentPolymorphicSerializer<CASResponse>(CASResponse::class) {
    override fun selectDeserializer(element: JsonElement) = when {
        "message" in element.jsonObject -> CASResponse.CASError.serializer()
        else -> CASResponse.CASEntry.serializer()
    }
}

private val cactusPath = URI("https://cactus.nci.nih.gov/chemical/structure/")

private val casPath = URI("https://commonchemistry.cas.org/api/")

enum class StructureIdentifiers(val id: String) {
    INCHI("stdinchi"),
    IUPAC("iupac_name"),
    SMILES("smiles")
}


suspend fun queryCAS(client: HttpClient, cas: CAS): Molecule? {
    val response = client.get(casPath.toString()) {
        url {
            appendPathSegments("detail", "")
            parameters.append("cas_rn", cas.toCASString())
        }
    }
    val result = Json { ignoreUnknownKeys = true }.decodeFromString(CASSerializer, response.body())

    val mol = when (result) {
        is CASResponse.CASEntry -> {
            Molecule(result.name, cas, result.inchi)
        }

        else -> {
            null
        }
    }
    return mol

}

suspend fun queryCactus(client: HttpClient, identifierType: StructureIdentifiers, identifier: String): String? {
    val path = URLEncoder.encode(identifier, "UTF-8")
    val result = try {
        val reqPath = cactusPath.resolve("${path}/${identifierType.id}").toString()
        val response = client.get(reqPath)
        val resp = when (response.status) {
            HttpStatusCode.OK -> response.bodyAsText()
            else -> null
        }
        resp
    } catch (e: HttpRequestTimeoutException) {
        null
    }
    return result
}

suspend fun moleculeFromCactus(identifier: CAS, client: HttpClient): Molecule? {

    val validMol = queryCAS(client, identifier)
    return if (validMol != null) {
        Molecule(validMol.iupacName, identifier, validMol.inChi)
    } else {
        null
    }
}

fun checkMolecules(db: Database, mol: List<SourceMolecule>): Map<SourceMolecule, Molecule?> {
    val logger by  AppLogger.logger {  }
    val res = transaction(db) {
        val validCas = mol.mapNotNull{val res = it.cas?.let{cas ->
            CAS.fromString(cas)?.toCASString()}
            //logger.info("${it.cas} gave CAS ${res}")
            res
        }
        val query = Chemical.select {
            Chemical.cas inList validCas
        }
        val res = query.mapNotNull {
            Molecule(
                it[Chemical.iupacName],
                CAS.fromString(it[Chemical.cas])!!,
                it[Chemical.inchi]
            )
        }
        val matched = mol.map { currentMol ->
            val res = res.find { row ->
                row.cas?.toCASString() == currentMol.cas
            }
            currentMol to res
        }.associate { (k, v) -> k to v }
        matched
    }
    return res
}

suspend fun checkMolecule(db: Database, client: HttpClient, mol: SourceMolecule): Molecule? {
    val logger by AppLogger.logger {  }
    val mol = suspendedTransactionAsync(db = db) {
        val query = Chemical.selectAll()
        val parsedCas = mol.cas?.let { CAS.fromString(it) }
        logger.info("Parsed CAS ${parsedCas}")
        when {
            (parsedCas != null) -> query.andWhere {
                logger.info("Checking CAS")
                Chemical.cas eq parsedCas.toCASString()
            }

            (mol.formula != null && parsedCas == null) -> query.andWhere {
                logger.info("Checking formula")
                Chemical.formula eq mol!!.formula.orEmpty()
            }

            (mol.formula == null && parsedCas == null) -> query.andWhere {
                logger.info("Checking formula")
                Chemical.iupacName eq mol!!.name.orEmpty()
            }

            else -> {
                query.andWhere { not(Chemical.formula eq Chemical.formula) }
            }
        }
        val matches = query.filterNotNull().take(1).map {
            Molecule(it[Chemical.iupacName], CAS.fromString(it[Chemical.cas])!!, it[Chemical.inchiKey])
        }.getOrElse(0) { ind ->
            logger.info("Checking CAS online")
            val mol = parsedCas?.let { moleculeFromCactus(it, client) }
            mol
        }
        //logger.info("Input ${mol} gave ${matches}")
        matches
    }.await()
    return mol
}

/**
 * Clean up list of chemicals
 * by keeping only those with valid CAS
 * To do so, we check the molecules against
 * a SQL Database that contains the CheBI molecule DB
 */
// TODO fix chemicals with valid CAS but not found in DB
fun cleanSourceMolecule(db: Database, chems: List<SourceMolecule>): List<Product> {
    val logger = LoggerFactory.getLogger("cleanMolecules")
    val matchedInDB = checkMolecules(db, chems)
    val matchCount = matchedInDB.filterValues { it != null }.count()
    logger.info("Matched ${matchCount} out ouf ${chems.size}")
    logger.info("Matching remaining chemicals against database")
    //Group chemicals by CAS
    val groupedByCAS = matchedInDB.asSequence().groupBy { (k, v) ->
        v
    }.map { (k, v) ->
        k to v.map { (k, v) -> k }
    }.associate { (k, v) -> k to v }.map { (mol, prods) ->
        prods.map { prod ->
            Product(
                prod.name ?: "prod",
                prod.cas?.let { CAS.fromString(it) },
                prod.supplier,
                prod.articleNumber,
                prod.purity,
                prod.packageSize,
                prod.location,
                mol?.let { listOf(mol) }
            )
        }
    }.flatten()
    return groupedByCAS
}
//    val sem = Semaphore(256)
//    val client = HttpClient(CIO) {
//        expectSuccess = false
//        install(ContentNegotiation) {
//            json(Json {
//                prettyPrint = true
//                isLenient = true
//                ignoreUnknownKeys = true
//            })
//        }
//        install(HttpTimeout) {
//            requestTimeoutMillis = 2000
//        }
//    }
//    val result =
//        CoroutineScope(Dispatchers.IO.limitedParallelism(10)).async {
//            println("Hello from ${this}")
//            //val res = sem.withPermit {
//                val allMols = matchedInDB.filterValues { it == null }.filterKeys { it.cas != null }.mapValues { (k, v) ->
//                    val mol = k.cas?.let { CAS.fromString(it) }?.let { queryCAS(client, it) }
//                    logger.info("${currentThread()} :Matching ${k} gave ${mol}, ${sem.availablePermits}")
//                    mol
//                }
//                allMols
//            }
//res
//            allMols
//        }
//    }
//}

//    thread() {
//        runBlocking { result.await() }
//
//}
//}
//    val matched = chems.map { chem ->
//        val matched = transaction(db) {
//            val query = Chemical.selectAll()
//            val parsedCas = chem.cas?.let { CAS.fromString(it) }
//            when {
//                (parsedCas != null) -> query.andWhere {
//                    Chemical.cas eq parsedCas.toCASString()
//                }
//
//                (chem.formula != null && parsedCas == null) -> query.andWhere {
//                    println("Here")
//                    Chemical.formula eq chem!!.formula.orEmpty()
//                }
//
//                (chem.formula == null && parsedCas == null) -> query.andWhere {
//                    println("IYOAC")
//                    Chemical.iupacName eq chem!!.name.orEmpty()
//                }
//            }
//            //println(query.prepareSQL(this).toString())
//            val matches = query.filterNotNull().take(1).map {
//                Molecule(it[Chemical.iupacName], CAS.fromString(it[Chemical.cas])!!, it[Chemical.inchiKey], null)
//            }.getOrElse(0) {
//                runBlocking {
//                    val mol = moleculeFromCactus(parsedCas, client)
//                    println(mol)
//                }
//            }
//            println("Chemical ${chem} gave ${matches}")
//            matches
//        }
//    }
//    return matched
//}
//    println(allCas.distinct().size)
//    val matches = transaction(db) {
//        val matched = Chemical.select {
//            (Chemical.cas inList allCas)
//        }
//        matched.mapNotNull {
//            Molecule(it[Chemical.iupacName], CAS.fromString(it[Chemical.cas])!!, it[Chemical.inchiKey], null)
//        }
//    }
//        chems.withIndex().map {( idx, chem) ->
//            if (idx % 1000 ==0 ) println(idx)
//            val query = Chemical.selectAll()
//            val parsedCas = chem.cas?.let { CAS.fromString(it) }
//            parsedCas?.let {
//                query.andWhere {
//                    Chemical.cas eq parsedCas.toCASString()
//                }
//            }

//            query.mapNotNull {
//                val mol =
//                    Molecule(it[Chemical.iupacName], CAS.fromString(it[Chemical.cas])!!, it[Chemical.inchiKey], null)
//                mol
//            }
//            val matchedChem = Chemical.select {
//                (Chemical.cas eq CAS.fromString(chem.cas).toCASString())
//            }.mapNotNull {
//                Molecule(it[Chemical.iupacName], CAS.fromString(it[Chemical.cas]), it[Chemical.inchiKey], null)
//            }
//            val prods = mols.map{Product(it.name, it.supplier, it.purity, it.packageSize, it.location)}
//            val mol = if(!matchedChem.isEmpty()) {
//                val firstChem = matchedChem.get(0)
//                Molecule(firstChem.iupacName, firstChem.cas, firstChem.inChi, prods)
//            }else{
//                null
//            }
//                mol
//}.flatMap { it -> Unit }
//}
//return res.filterNotNull()
//}
fun storeProductInCollection(
    token: String,
    openbis: IApplicationServerApi,
    collection: String,
    mols: List<Product>
): Unit {

}
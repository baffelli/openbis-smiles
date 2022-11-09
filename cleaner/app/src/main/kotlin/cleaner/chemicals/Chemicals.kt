package cleaner.chemicals

import cleaner.io.Chemical
import java.time.LocalDateTime;
import kotlinx.serialization.Serializable


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
import kotlinx.coroutines.sync.Semaphore
import kotlinx.coroutines.sync.withPermit
import io.ktor.client.plugins.contentnegotiation.*
import kotlinx.serialization.json.Json
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction

@Serializable
data class CAS(val first: String, val middle: String, val checksum: String) {
    init {
        val computedChecksun = checksumCAS(first + middle)
        val checksumNumber = checksum.toInt()
        require(computedChecksun == checksumNumber) {}
    }

    fun toCASString(): String {
        return "${first}-${middle}-${checksum}"
    }

    companion object {
        fun fromString(cas: String): CAS {
            val components = splitCAS(cas)
            return CAS(components[0], components[1], components[2])
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

private val casPattern = Regex("(\\d{2,7})[-\\.](\\d{2})[-\\.](\\d{1})")

/** Checks whether the given string conforms to the pattern for CAS numbers
 *
 * @param input the string to check
 *
 * @return True if the format is valid, false otherwise
 *
 */
private fun checkCASPattern(input: String): Boolean {
    val pattern = casPattern
    return pattern.matches(input)
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
    val els = casPattern.matchEntire(input)
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


/**
 * Represents an (abstract molecule)
 */
@Serializable
data class Molecule(val iupacName: String, val cas: CAS, val inChi: String, val products: List<Product>?)

/**
 * Represent a concrete product derived from a molecule
 */
@Serializable
data class Product(
    val name: String,
    val supplier: String?,
    val purity: String?,
    val quantity: String?,
    val location: String?
)


/**
 * Represent a molecule as it is stored in the source openbis
 * instance
 */
data class SourceMolecule(val values: Map<String, Any?>) {
    private val defaultMap = values.withDefault { null }
    val name: String by defaultMap
    val formula: String? by defaultMap
    val cas: String by defaultMap
    val supplier: String? by defaultMap
    val articleNumber: String? by defaultMap
    val lotNumber: String? by defaultMap
    val purity: String? by defaultMap
    val packageSize: String? by defaultMap
    val storageConditions: String? by defaultMap
    val laboratory: String? by defaultMap
    val whoOrdered: String? by defaultMap
    val orderDate: LocalDateTime by defaultMap
    val location: String? by defaultMap
    val available: Boolean? by defaultMap
    val reference: String? by defaultMap
    val publication: String? by defaultMap
    val notes: String? by defaultMap
}

/**
 * Represents the response of the CAS registry service
 */
@Serializable
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
)


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
    val result: CASEntry = response.body()
    return Molecule(result.name, cas, result.inchi, null)
}

suspend fun queryCactus(client: HttpClient, identifier: StructureIdentifiers, cas: CAS): String? {
    val path = URLEncoder.encode(cas.toCASString(), "UTF-8")
    val result = try {
        val reqPath = cactusPath.resolve("${path}/${identifier.id}").toString()
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

suspend fun moleculeFromSourceMolecule(cas: String, mol: List<SourceMolecule>, client: HttpClient): Molecule? {
    val validCas = CAS.fromString(cas)
    val validMol = queryCAS(client, validCas)
    if (validMol != null) {
        val prods = mol.map { prod -> Product(prod.name, prod.supplier, prod.purity, prod.packageSize, prod.location) }
        return Molecule(validMol.iupacName, validCas, validMol.inChi, prods)
    } else {
        return null
    }
}

/**
 * Clean up list of chemicals
 * by keeping only those with valid CAS
 * To do so, we check the molecules against
 * a SQL Database that contains the PubCHem molecule DB
 */
fun cleanSourceMolecule(db: Database, chems: List<SourceMolecule>): List<Molecule> {
    val matches = transaction(db) {
        chems.groupBy { it.cas }.map { (cas, mols) ->
            val matchedChem = Chemical.select {
                Chemical.cas eq cas
            }.map {
                Molecule(it[Chemical.iupacName], CAS.fromString(it[Chemical.cas]), it[Chemical.inChi], null)
            }
            val prods = mols.map{Product(it.name, it.supplier, it.purity, it.packageSize, it.location)}
            val mol = if(!matchedChem.isEmpty()) {
                val firstChem = matchedChem.get(0)
                Molecule(firstChem.iupacName, firstChem.cas, firstChem.inChi, prods)
            }else{
                null
            }
                mol
        }
    }
    return matches.filterNotNull()
}

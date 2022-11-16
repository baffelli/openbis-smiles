package cleaner.openbis

import ch.ethz.sis.openbis.generic.asapi.v3.IApplicationServerApi
import ch.ethz.sis.openbis.generic.asapi.v3.dto.experiment.Experiment
import ch.ethz.sis.openbis.generic.asapi.v3.dto.experiment.id.ExperimentIdentifier
import ch.ethz.sis.openbis.generic.asapi.v3.dto.sample.Sample
import ch.ethz.sis.openbis.generic.asapi.v3.dto.sample.create.SampleCreation
import ch.ethz.sis.openbis.generic.asapi.v3.dto.sample.delete.SampleDeletionOptions
import ch.ethz.sis.openbis.generic.asapi.v3.dto.sample.fetchoptions.SampleFetchOptions
import ch.ethz.sis.openbis.generic.asapi.v3.dto.sample.search.SampleSearchCriteria
import ch.ethz.sis.openbis.generic.asapi.v3.dto.space.id.SpacePermId
import ch.systemsx.cisd.common.spring.HttpInvokerUtils
import kotlinx.serialization.Serializable
import org.xml.sax.InputSource
import java.io.StringReader
import java.net.URI
import javax.xml.parsers.DocumentBuilderFactory
import javax.xml.xpath.XPathConstants
import javax.xml.xpath.XPathFactory
import kotlin.properties.ReadOnlyProperty
import kotlin.reflect.KProperty
import ch.ethz.sis.openbis.generic.asapi.v3.dto.common.operation.IOperation
import ch.ethz.sis.openbis.generic.asapi.v3.dto.operation.IOperationExecutionOptions
import ch.ethz.sis.openbis.generic.asapi.v3.dto.sample.id.SamplePermId
import cleaner.logging.AppLogger
import kotlinx.coroutines.*
import kotlinx.coroutines.sync.Semaphore
import kotlinx.coroutines.sync.withPermit


/**
 * Interface that represents an object
 * that can be stored in OpenBIS
 */
interface OpenBISStorable {
    fun toSampleCreation(propertyMapping: OpenbisPropertyMapping): SampleCreation
}

/**
 * Serializable class representing a mapping of openbis object
 * properties to a Kotlin object by storing a Map<String, String>.
 * It can be conveniently initialised from json as it is serialisable. The keys are the
 * kotlin object names, the values are the openbis property names
 */
@Serializable
data class OpenbisPropertyMapping(val fields: Map<String, String>, val type: String) {
    fun <T> transformMap(props: Map<String, T>): Map<String, T> {
        val renamed = (props.mapKeys { (key) -> fields.filterValues { it == key }.keys?.firstOrNull() }
            .filterKeys { it != null } as? Map<String, T>) ?: emptyMap()
        return renamed
    }

    fun mapSamples(samp: Sample): Map<String, Any> {
        return transformMap(samp.properties)
    }

    /***
     * Reverses the mapping
     */
    fun reverseMap(): OpenbisPropertyMapping {
        return OpenbisPropertyMapping(fields.asSequence().associate { (k, v) -> v to k }, type)
    }
}

/***
 * Serialisable class representing several mappings
 * of openbis objects to kotlin objects
 */
@Serializable
data class OpenbisSampleMapping(val mappings: List<OpenbisPropertyMapping>) {
    fun getMapping(type: String): OpenbisPropertyMapping? {
        return mappings.find { it.type == type }
    }
}

fun documentFromStringProperty(map: Map<String?, Any>): ReadOnlyProperty<Any, String?> {
    return object : ReadOnlyProperty<Any, String?> {
        override fun getValue(thisRef: Any, property: KProperty<*>): String? {
            val factory = DocumentBuilderFactory.newInstance();
            val builder = factory.newDocumentBuilder();
            val res = try {
                val doc = builder.parse(InputSource(StringReader(map[property.name] as String)))
                val xp = XPathFactory.newInstance().newXPath();
                val exp = xp.compile("/html")
                val nodes = exp.evaluate(doc, XPathConstants.STRING);
                nodes as String
            } catch (e: Exception) {
                map[property.name] as String?
            }

            return res

        }
    }

}

fun createOpenbisInstance(instance: URI, timeout: Long = 100000L): IApplicationServerApi {
    val facade = HttpInvokerUtils.createServiceStub(
        IApplicationServerApi::class.java,
        instance.toString() + IApplicationServerApi.SERVICE_URL,
        timeout
    )

    return facade

}


fun getObjectsInCollection(token: String, openbis: IApplicationServerApi, identifier: String): List<Sample> {
    val criteria = SampleSearchCriteria();
    criteria.withExperiment().withIdentifier().thatEquals(identifier);
    val fetchOptions = SampleFetchOptions();
    fetchOptions.withProperties();
    return openbis.searchSamples(token, criteria, fetchOptions).objects
}


data class OpenbisIdentifier(val space: String, val project: String?, val sample: String?) {
    companion object {
        private val pathPattern = Regex("(\\/[\\w|\\d|_]+)(\\/[\\w|\\d|_]+)?(\\/[\\w|\\d|_]+)?")
        fun fromPath(path: String): OpenbisIdentifier {
            require(pathPattern.matches(path)) { "The string ${path} is not a valid identifier" }
            val components = pathPattern.find(path)
            val res = components!!.groupValues.map { it.replace('\\', Char.MIN_VALUE) }.drop(1)
            val newOb = when (res.size) {
                1 -> OpenbisIdentifier(res.get(0)!!, null, null)
                2 -> OpenbisIdentifier(res.get(0)!!, res.get(1)!!, null)
                3 -> OpenbisIdentifier(res.get(0)!!, res.get(1)!!, res.get(2)!!)
                else -> throw Exception("Invalid path: ${res}")
            }
            return newOb
        }
    }
}


fun addDataClassToCollection(
    collectionIdentifier: String,
    mapping: OpenbisPropertyMapping,
    samp: OpenBISStorable
): SampleCreation {
    val coll = Experiment().apply {
        identifier = ExperimentIdentifier(collectionIdentifier)
    }
    val path = OpenbisIdentifier.fromPath(collectionIdentifier)
    val creation = samp.toSampleCreation(mapping).apply {
        experimentId = coll.identifier
        spaceId = SpacePermId(path.space)
    }
    return creation
}

fun clearCollection(openBIS: IApplicationServerApi, token: String, collectionIdentifier: String) {
    val coll = Experiment().apply {
        identifier = ExperimentIdentifier(collectionIdentifier)
    }
    val path = OpenbisIdentifier.fromPath(collectionIdentifier)
    val searchCriteria = SampleSearchCriteria().apply {
        this.withExperiment().withIdentifier().thatEquals(collectionIdentifier)
    }
    val fetchOptions = SampleFetchOptions()
    val samples = openBIS.searchSamples(token, searchCriteria, fetchOptions)
    val deleteOptions = SampleDeletionOptions().setReason("Automatically deleted")
    openBIS.deleteSamples(token, samples.objects.map { it.identifier }, deleteOptions)
}

@ExperimentalCoroutinesApi
fun <K> fillCollection(
    openBIS: URI,
    token: String,
    collectionIdentifier: String,
    creations: Map<K, SampleCreation>,
    batchSize: Int = 100
): Map<K, SamplePermId> {
    val logger by AppLogger.logger { }
    val scope = CoroutineScope(Dispatchers.IO.limitedParallelism(10))
    val sem = Semaphore(10)
    val jobs = creations.asIterable().chunked(batchSize).map { chunk ->
        val creations = chunk.map { (k, v) -> v }
        val origSamps = chunk.map { (k, v) -> k }
        val res = scope.async {
            sem.withPermit {
                val openbisInner = createOpenbisInstance(openBIS)
                logger.info("Creating ${batchSize} samples")
                val created = openbisInner.createSamples(token, creations)
                (created zip origSamps).associate { (k, v) -> v to k }
            }
        }
        res
    }
    return runBlocking {
        jobs.awaitAll().flatMap { it.entries }.associate { it.key to it.value }
    }
}





package cleaner.openbis

import kotlinx.serialization.Serializable
import ch.ethz.sis.openbis.generic.asapi.v3.dto.sample.Sample

import javax.xml.parsers.DocumentBuilderFactory;
import kotlin.properties.ReadOnlyProperty
import kotlin.reflect.KProperty
import java.io.StringReader
import org.xml.sax.InputSource
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathFactory;

/**
 * Serializable class representing a mapping of openbis object
 * properties to a Kotlin object by storing a Map<String, String>.
 * It can be conveniently initialised from json as it is serialisable
 */
@Serializable
class OpenbisPropertyMapping(val fields: Map<String, String>) {
    fun transformMap(props: Map<String, Any>): Map<String, Any> {
        return props.mapKeys { (key) -> fields[key] }.filterKeys { it != null } as? Map<String, Any>
            ?: emptyMap<String, Any>()
    }

    fun mapSamples(samp: Sample): Map<String, Any> {
        return transformMap(samp.properties)
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

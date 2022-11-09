package cleaner.arrow



import org.apache.arrow.memory.BufferAllocator;
import org.apache.arrow.memory.RootAllocator;
import org.apache.arrow.vector.IntVector;
import org.apache.arrow.vector.VarCharVector;
import org.apache.arrow.vector.VectorSchemaRoot;
import org.apache.arrow.vector.types.pojo.ArrowType;
import org.apache.arrow.vector.types.pojo.Field;
import org.apache.arrow.vector.types.pojo.FieldType;
import org.apache.arrow.vector.types.pojo.Schema;
import kotlin.reflect.KProperty1
import kotlin.reflect.KType
import kotlin.reflect.typeOf
import kotlin.reflect.KClass
import kotlin.reflect.full.memberProperties;


fun kotlinPropertyToArrowField(currentField: KProperty1<*, *>): Field {
    val fd = currentField.returnType
    val tp = when(fd){
        typeOf<Int>() -> ArrowType.Int(32, true)
        typeOf<String>() -> ArrowType.Utf8()
        else -> ArrowType.Utf8()
    }
    return Field(currentField.name, FieldType(true, tp, null), null)
}

fun <T: Any>classToarrowSchema(cls: KClass<T>): Schema{
    val mapped = cls.memberProperties.map{ fl -> kotlinPropertyToArrowField(fl) }
    return Schema(mapped)
}
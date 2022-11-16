package cleaner.logging

import org.slf4j.LoggerFactory
import org.slf4j.Logger


class AppLogger{
    companion object{
        fun logger(lambda: () -> Unit): Lazy<Logger> = lazy { LoggerFactory.getLogger(getClassName(lambda.javaClass)) }
        private fun <T : Any> getClassName(clazz: Class<T>): String = clazz.name.replace(Regex("""\$.*$"""), "")

    }

}




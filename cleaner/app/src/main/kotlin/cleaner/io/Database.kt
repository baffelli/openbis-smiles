package cleaner.io


import org.jetbrains.exposed.sql.*

import org.jetbrains.exposed.sql.transactions.transaction
import java.io.File
import java.net.URL

object Chemical : Table() {
    val id = varchar("id", 256)
    val cas = varchar("cas", 14).index("IX_Chemical_CAS")
    val inchiKey = varchar("inchi_key", 128)
    val inchi = varchar("inchi", 8192)
    val iupacName = varchar("iupac_name", 4096)
    val formula = varchar("formula", 1024).index("IX_Chemical_formula")
    override val primaryKey = PrimaryKey(id, inchiKey, cas, iupacName, formula, name = "PK_Chemical_CAS_inchi_name")
}

object ChemicalName : Table() {
    val cas = varchar("cas", 12)
    val name = varchar("name", 1024)
    override val primaryKey = PrimaryKey(Chemical.cas, name = "PK_ChemicalName_CAS")
}


fun getDb(path: String): Database {
    return Database.connect("jdbc:sqlite:${path}", "org.sqlite.JDBC")
}

fun checkChemicals(db: Database): Boolean {
    val ex = transaction(db) {
        Chemical.exists()
    }
    return ex
}

fun createChemicals(db: Database): Unit {
    transaction(db) {
        SchemaUtils.create(Chemical)
    }
}
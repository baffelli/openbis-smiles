package cleaner.io


import org.jetbrains.exposed.sql.*

import org.jetbrains.exposed.sql.transactions.transaction
import java.io.File
import java.net.URL

object Chemical : Table() {
    val cas = varchar("cas", 12)
    val inChi = varchar("inchi", 1024)
    val iupacName = varchar("iupac_name", 1024)
    override val primaryKey = PrimaryKey(cas, inChi, name = "PK_Chemical_CAS_incChi")
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
        SchemaUtils.create(ChemicalName, Chemical)
    }
}
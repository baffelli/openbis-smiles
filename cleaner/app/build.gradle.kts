import org.jetbrains.kotlin.ir.backend.js.transformers.irToJs.argumentsWithVarargAsSingleArray

/*
 * This file was generated by the Gradle 'init' task.
 *
 * This generated file contains a sample Kotlin application project to get you started.
 * For more details take a look at the 'Building Java & JVM projects' chapter in the Gradle
 * User Manual available at https://docs.gradle.org/6.9.3/userguide/building_java_projects.html
 */
plugins {
    // Apply the org.jetbrains.kotlin.jvm Plugin to add support for Kotlin.
    val kotlinVer = "1.7.21"
    // Apply the org.jetbrains.kotlin.jvm Plugin to add support for Kotlin.
    id("org.jetbrains.kotlin.jvm") version kotlinVer
    //Plugin for serialisation
    id("org.jetbrains.kotlin.plugin.serialization") version kotlinVer
    // Apply the application plugin to add support for building a CLI application in Java.
    application

}

repositories {
    // Use Maven Central for resolving dependencies.
    mavenCentral()
    // Openbis
    ivy {
        url = uri("https://sissource.ethz.ch/openbis/openbis-public/openbis-ivy/-/raw/main/")
        patternLayout {

            artifact("[organisation]/[module]/[revision]/[artifact]-[revision](-[classifier]).[ext]")
            ivy("[organisation]/[module]/[revision]/ivy.xml")
        }
    }
    //SDF Eater (Not used now)
    ivy {
        url = uri("https://github.com/lszeremeta/")
        patternLayout {
            artifact("[module]/releases/download/v[revision]/[artifact]-[revision](-[classifier]).[ext]")
        }
        metadataSources {
            artifact()
        }
    }

}



dependencies {
    // Align versions of all Kotlin components
    implementation(platform("org.jetbrains.kotlin:kotlin-bom"))

    // Use the Kotlin JDK 8 standard library.
    implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8")

    // Use the Kotlin test library.
    testImplementation("org.jetbrains.kotlin:kotlin-test")

    // Use the Kotlin JUnit integration.
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit")

    //Apache arrow
    val useArrow: String by project
    if (useArrow.toBoolean()) {
        val arrowVer: String by project
        implementation("org.apache.arrow:arrow-vector:${arrowVer}")
        implementation("org.apache.arrow:arrow-dataset:${arrowVer}")
        implementation("org.apache.arrow:arrow-memory-netty:${arrowVer}")
    }


    //Dataframes in kotlin
    val dataFrameVer: String by project
    implementation("org.jetbrains.kotlinx:dataframe:${dataFrameVer}")

    //openBIS API
    val openBISVer: String by project
    implementation("openbis:openbis-v3-api:${openBISVer}")

    // Kotlinx for serialization
    val serialVer: String by project
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:${serialVer}")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-properties:${serialVer}")


    //Reflection
    implementation("org.jetbrains.kotlin:kotlin-reflect")


    //Ktor
    val ktorVer: String by project
    implementation("io.ktor:ktor-client-core:${ktorVer}")
    implementation("io.ktor:ktor-client-cio:${ktorVer}")
    implementation("io.ktor:ktor-client-content-negotiation:${ktorVer}")
    implementation("io.ktor:ktor-serialization-kotlinx-json:${ktorVer}")

    //Command line parsing
    implementation("com.github.ajalt.clikt:clikt:3.5.0")
    implementation("org.jetbrains.kotlinx:kotlinx-cli:0.3.5")

    //SDF file reader
    val openchemlibVer: String by project
    implementation("com.actelion.research:openchemlib:${openchemlibVer}")

    //SQLLite
    val sqlliteVer: String by project
    implementation("org.xerial:sqlite-jdbc:${sqlliteVer}")

    //ORM
    val exposedVer: String by project
    implementation("org.jetbrains.exposed:exposed-core:${exposedVer}")
    implementation("org.jetbrains.exposed:exposed-jdbc:${exposedVer}")

    //Logging
    implementation("org.slf4j:slf4j-jdk14:2.0.3")
}

application {
    // Define the main class for the application.
    mainClass.set("cleaner.app.AppKt")
    applicationDefaultJvmArgs = listOf("-Dhttps.protocols=TLSv1")
}



tasks.withType<Test> {
    this.testLogging {
        this.showStandardStreams = true
    }
}

// compile bytecode to java 11 (default is java 6)
kotlin {
    jvmToolchain {
        val javaVer: String by project
        languageVersion.set(JavaLanguageVersion.of(javaVer))
    }
}

tasks.named("run") {
    doFirst {
        val cmdArgs = listOf(
            "../../data/exportedTableAllColumnsAllPages.tsv",
            "../config/molecule.json",
            "../../data/ChEBI_complete.sdf",
            "../../data/chemicals.sqlite",
            "../config/dest_molecule.json",
            "/MATERIALS/GENERAL_MATERIALS/PRODUCTS"
        )
        val res = this.setProperty("args", cmdArgs)

    }
}
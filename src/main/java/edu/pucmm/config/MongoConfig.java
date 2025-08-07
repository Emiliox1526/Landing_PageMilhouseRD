package edu.pucmm.config;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.ServerApi;
import com.mongodb.ServerApiVersion;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;

/**
 * Configura un singleton de MongoClient utilizando la cadena de
 * conexión definida en la variable de entorno {@code MONGODB_URI}.
 * De este modo se puede conectar fácilmente a MongoDB Atlas u otra
 * instancia en la nube.
 */
public class MongoConfig {

    private static final String ENV_VAR = "MONGODB_URI";
    private static final MongoClient CLIENT;
    private static final MongoDatabase DATABASE;

    static {
        String uri = System.getenv(ENV_VAR);
        if (uri == null || uri.isBlank()) {
            throw new IllegalStateException("La variable de entorno " + ENV_VAR + " no está definida");
        }
        ConnectionString connectionString = new ConnectionString(uri);
        MongoClientSettings settings = MongoClientSettings.builder()
                .applyConnectionString(connectionString)
                .serverApi(ServerApi.builder().version(ServerApiVersion.V1).build())
                .build();
        CLIENT = MongoClients.create(settings);
        String dbName = connectionString.getDatabase();

        System.out.println("🔗 URI leída: " + uri);
        if (dbName == null || dbName.trim().isEmpty()) {
            dbName = "Test";
        }
        DATABASE = CLIENT.getDatabase(dbName);
        System.out.println("✅ Conectando a DB: " + dbName);
    }

    private MongoConfig() { /* evita instanciación */ }

    /**
     * Devuelve el cliente Mongo configurado.
     */
    public static MongoClient getClient() {
        return CLIENT;
    }

    /**
     * Devuelve la base de datos por defecto indicada en la URI.
     */
    public static MongoDatabase getDatabase() {
        return DATABASE;
    }
}


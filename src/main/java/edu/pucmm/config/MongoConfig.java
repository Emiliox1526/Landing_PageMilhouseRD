package edu.pucmm.config;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.ServerApi;
import com.mongodb.ServerApiVersion;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.gridfs.GridFSBucket;
import com.mongodb.client.gridfs.GridFSBuckets;

/**
 * Configura un singleton de MongoClient utilizando la cadena de
 * conexión definida en la variable de entorno {@code MONGODB_URI}.
 * Compatible con Atlas y Render.
 */
public class MongoConfig {

    private static final String ENV_VAR = "MONGODB_URI";
    private static final MongoClient CLIENT;
    private static final MongoDatabase DATABASE;
    private static final GridFSBucket BUCKET;

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
        if (dbName == null || dbName.trim().isEmpty()) {
            dbName = "Test";
        }
        DATABASE = CLIENT.getDatabase(dbName);
        BUCKET = GridFSBuckets.create(DATABASE);
        System.out.println("✅ Conectado a DB: " + dbName);
    }

    private MongoConfig() {}

    /** Cliente Mongo */
    public static MongoClient getClient() {
        return CLIENT;
    }

    /** Base de datos por defecto */
    public static MongoDatabase getDatabase() {
        return DATABASE;
    }

    /** GridFS bucket para subir/descargar archivos */
    public static GridFSBucket getGridFSBucket() {
        return BUCKET;
    }
}

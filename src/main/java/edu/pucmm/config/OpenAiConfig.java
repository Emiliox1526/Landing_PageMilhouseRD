package edu.pucmm.config;

import com.theokanning.openai.service.OpenAiService;

/**
 * Inicializa un singleton de OpenAiService leyendo la API Key
 * de la variable de entorno OPENAI_API_KEY.
 */
public class OpenAiConfig {

    private static final String ENV_VAR = "OPENAI_API_KEY";
    private static final OpenAiService SERVICE;

    static {
        String apiKey = System.getenv(ENV_VAR);
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("La variable de entorno " + ENV_VAR + " no está definida");
        }
        SERVICE = new OpenAiService(apiKey);
    }

    private OpenAiConfig() { /* no-instancia */ }

    /** Devuelve el cliente configurado para llamar a la API */
    public static OpenAiService getService() {
        return SERVICE;
    }
}

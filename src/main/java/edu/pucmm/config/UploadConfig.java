package edu.pucmm.config;

import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Properties;
import java.util.Set;

/**
 * Configuration loader for image upload settings.
 * Loads configuration from upload-config.properties file.
 */
public class UploadConfig {
    
    private static final Properties props = new Properties();
    private static boolean loaded = false;
    
    // Default values
    public static final int DEFAULT_MAX_IMAGE_SIZE_MB = 25;
    public static final int DEFAULT_MAX_IMAGES_PER_BATCH = 100;
    public static final int DEFAULT_MAX_REQUEST_SIZE_MB = 2600;
    
    static {
        loadConfig();
    }
    
    private static void loadConfig() {
        if (loaded) return;
        
        try (InputStream is = UploadConfig.class.getClassLoader()
                .getResourceAsStream("upload-config.properties")) {
            if (is != null) {
                props.load(is);
                loaded = true;
            }
        } catch (IOException e) {
            System.err.println("Warning: Could not load upload-config.properties, using defaults: " + e.getMessage());
        }
    }
    
    /**
     * Get maximum image size in MB
     */
    public static int getMaxImageSizeMB() {
        String value = props.getProperty("max.image.size.mb");
        if (value == null) return DEFAULT_MAX_IMAGE_SIZE_MB;
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            return DEFAULT_MAX_IMAGE_SIZE_MB;
        }
    }
    
    /**
     * Get maximum image size in bytes
     */
    public static long getMaxImageSizeBytes() {
        return getMaxImageSizeMB() * 1024L * 1024L;
    }
    
    /**
     * Get maximum number of images per batch
     */
    public static int getMaxImagesPerBatch() {
        String value = props.getProperty("max.images.per.batch");
        if (value == null) return DEFAULT_MAX_IMAGES_PER_BATCH;
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            return DEFAULT_MAX_IMAGES_PER_BATCH;
        }
    }
    
    /**
     * Get maximum request size in MB
     */
    public static int getMaxRequestSizeMB() {
        String value = props.getProperty("max.request.size.mb");
        if (value == null) return DEFAULT_MAX_REQUEST_SIZE_MB;
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            return DEFAULT_MAX_REQUEST_SIZE_MB;
        }
    }
    
    /**
     * Get maximum request size in bytes
     */
    public static long getMaxRequestSizeBytes() {
        return getMaxRequestSizeMB() * 1024L * 1024L;
    }
    
    /**
     * Get set of allowed image extensions (lowercase, with dot)
     */
    public static Set<String> getAllowedExtensions() {
        String value = props.getProperty("allowed.image.extensions", 
            ".jpg,.jpeg,.png,.gif,.bmp,.webp,.svg,.tiff,.tif");
        String[] parts = value.toLowerCase().split(",");
        return new HashSet<>(Arrays.asList(parts));
    }
    
    /**
     * Get set of allowed MIME types
     */
    public static Set<String> getAllowedMimeTypes() {
        String value = props.getProperty("allowed.mime.types",
            "image/jpeg,image/png,image/gif,image/bmp,image/webp,image/svg+xml,image/tiff");
        String[] parts = value.toLowerCase().split(",");
        return new HashSet<>(Arrays.asList(parts));
    }
    
    /**
     * Check if strict MIME validation is enabled
     */
    public static boolean isStrictMimeValidationEnabled() {
        return Boolean.parseBoolean(props.getProperty("strict.mime.validation", "true"));
    }
    
    /**
     * Check if magic byte validation is enabled
     */
    public static boolean isMagicByteValidationEnabled() {
        return Boolean.parseBoolean(props.getProperty("enable.magic.byte.validation", "true"));
    }
}

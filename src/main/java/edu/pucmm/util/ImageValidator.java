package edu.pucmm.util;

import edu.pucmm.config.UploadConfig;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * Utility class for validating image files.
 * Validates file extensions, MIME types, and magic bytes to prevent malicious uploads.
 */
public class ImageValidator {
    
    // Magic bytes for common image formats
    private static final Map<String, byte[][]> MAGIC_BYTES = new HashMap<>();
    
    static {
        // JPEG magic bytes
        MAGIC_BYTES.put("image/jpeg", new byte[][] {
            {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF}
        });
        
        // PNG magic bytes
        MAGIC_BYTES.put("image/png", new byte[][] {
            {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A}
        });
        
        // GIF magic bytes
        MAGIC_BYTES.put("image/gif", new byte[][] {
            {0x47, 0x49, 0x46, 0x38, 0x37, 0x61}, // GIF87a
            {0x47, 0x49, 0x46, 0x38, 0x39, 0x61}  // GIF89a
        });
        
        // BMP magic bytes
        MAGIC_BYTES.put("image/bmp", new byte[][] {
            {0x42, 0x4D}
        });
        
        // WebP magic bytes
        MAGIC_BYTES.put("image/webp", new byte[][] {
            {0x52, 0x49, 0x46, 0x46} // RIFF (need to check WEBP at offset 8)
        });
        
        // TIFF magic bytes
        MAGIC_BYTES.put("image/tiff", new byte[][] {
            {0x49, 0x49, 0x2A, 0x00}, // Little endian
            {0x4D, 0x4D, 0x00, 0x2A}  // Big endian
        });
        
        // SVG is XML-based, no binary magic bytes
        MAGIC_BYTES.put("image/svg+xml", new byte[][] {
            {0x3C, 0x3F, 0x78, 0x6D, 0x6C}, // <?xml
            {0x3C, 0x73, 0x76, 0x67}        // <svg
        });
    }
    
    /**
     * Validates if a file extension is allowed
     */
    public static boolean isExtensionAllowed(String filename) {
        if (filename == null || filename.isEmpty()) {
            return false;
        }
        
        String extension = getExtension(filename).toLowerCase();
        if (extension.isEmpty()) {
            return false;
        }
        
        return UploadConfig.getAllowedExtensions().contains(extension);
    }
    
    /**
     * Validates if a MIME type is allowed
     */
    public static boolean isMimeTypeAllowed(String mimeType) {
        if (mimeType == null || mimeType.isEmpty()) {
            return false;
        }
        
        return UploadConfig.getAllowedMimeTypes().contains(mimeType.toLowerCase());
    }
    
    /**
     * Validates magic bytes of a file to ensure it matches the declared MIME type
     */
    public static boolean validateMagicBytes(InputStream inputStream, String mimeType) throws IOException {
        if (!UploadConfig.isMagicByteValidationEnabled()) {
            return true; // Skip validation if disabled
        }
        
        if (mimeType == null || inputStream == null) {
            return false;
        }
        
        String normalizedMime = mimeType.toLowerCase();
        
        // SVG validation is special - it's text-based
        if ("image/svg+xml".equals(normalizedMime)) {
            return validateSvg(inputStream);
        }
        
        byte[][] expectedMagicBytes = MAGIC_BYTES.get(normalizedMime);
        if (expectedMagicBytes == null) {
            // Unknown MIME type, allow if MIME validation is not strict
            return !UploadConfig.isStrictMimeValidationEnabled();
        }
        
        // Read first 12 bytes (enough for most magic bytes)
        byte[] header = new byte[12];
        int bytesRead = inputStream.read(header);
        
        if (bytesRead < 0) {
            return false;
        }
        
        // Check if any of the magic byte patterns match
        for (byte[] magicBytes : expectedMagicBytes) {
            if (matchesMagicBytes(header, magicBytes)) {
                // Special case for WebP - need to verify WEBP signature at offset 8
                if ("image/webp".equals(normalizedMime)) {
                    return bytesRead >= 12 && 
                           header[8] == 0x57 && header[9] == 0x45 && 
                           header[10] == 0x42 && header[11] == 0x50;
                }
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Special validation for SVG files (text-based)
     */
    private static boolean validateSvg(InputStream inputStream) throws IOException {
        byte[] header = new byte[100]; // Read more bytes for SVG
        int bytesRead = inputStream.read(header);
        
        if (bytesRead < 4) {
            return false;
        }
        
        String headerStr = new String(header, 0, Math.min(bytesRead, 100)).toLowerCase();
        
        // Check for XML or SVG tags
        return headerStr.contains("<?xml") || headerStr.contains("<svg");
    }
    
    /**
     * Checks if the file header matches the expected magic bytes
     */
    private static boolean matchesMagicBytes(byte[] header, byte[] magicBytes) {
        if (header.length < magicBytes.length) {
            return false;
        }
        
        for (int i = 0; i < magicBytes.length; i++) {
            if (header[i] != magicBytes[i]) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Extracts the file extension from a filename
     */
    public static String getExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return "";
        }
        
        int lastDot = filename.lastIndexOf('.');
        if (lastDot > 0 && lastDot < filename.length() - 1) {
            return filename.substring(lastDot).toLowerCase();
        }
        
        return "";
    }
    
    /**
     * Gets the extension from a MIME type
     */
    public static String getExtensionFromMimeType(String mimeType) {
        if (mimeType == null || mimeType.isEmpty()) {
            return "";
        }
        
        Map<String, String> mimeToExt = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/gif", ".gif",
            "image/bmp", ".bmp",
            "image/webp", ".webp",
            "image/svg+xml", ".svg",
            "image/tiff", ".tiff"
        );
        
        return mimeToExt.getOrDefault(mimeType.toLowerCase(), "");
    }
    
    /**
     * Comprehensive validation of an image file
     */
    public static ValidationResult validate(String filename, String mimeType, InputStream inputStream, long fileSize) {
        ValidationResult result = new ValidationResult();
        
        // Check file size
        if (fileSize > UploadConfig.getMaxImageSizeBytes()) {
            result.addError("File size exceeds maximum allowed size of " + UploadConfig.getMaxImageSizeMB() + "MB");
        }
        
        if (fileSize <= 0) {
            result.addError("File is empty");
        }
        
        // Check extension
        if (!isExtensionAllowed(filename)) {
            result.addError("File extension not allowed. Allowed extensions: " + UploadConfig.getAllowedExtensions());
        }
        
        // Check MIME type
        if (!isMimeTypeAllowed(mimeType)) {
            result.addError("MIME type not allowed. Allowed types: " + UploadConfig.getAllowedMimeTypes());
        }
        
        // Validate magic bytes if stream is available
        if (inputStream != null && UploadConfig.isMagicByteValidationEnabled()) {
            try {
                if (!inputStream.markSupported()) {
                    // If mark not supported, skip magic byte validation
                    // This will be handled by the caller who can wrap in BufferedInputStream
                } else {
                    inputStream.mark(12);
                    if (!validateMagicBytes(inputStream, mimeType)) {
                        result.addError("File content does not match declared type (possible malicious file)");
                    }
                    inputStream.reset();
                }
            } catch (IOException e) {
                result.addError("Error validating file content: " + e.getMessage());
            }
        }
        
        return result;
    }
    
    /**
     * Result of validation
     */
    public static class ValidationResult {
        private final java.util.List<String> errors = new java.util.ArrayList<>();
        
        public void addError(String error) {
            errors.add(error);
        }
        
        public boolean isValid() {
            return errors.isEmpty();
        }
        
        public java.util.List<String> getErrors() {
            return errors;
        }
        
        public String getErrorMessage() {
            return String.join("; ", errors);
        }
    }
}

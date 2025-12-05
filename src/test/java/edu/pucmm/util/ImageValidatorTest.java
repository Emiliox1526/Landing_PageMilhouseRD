package edu.pucmm.util;

import org.junit.Test;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;

import static org.junit.Assert.*;

/**
 * Tests for ImageValidator utility class
 */
public class ImageValidatorTest {

    @Test
    public void testExtensionValidation_AllowedExtensions() {
        assertTrue("JPG should be allowed", ImageValidator.isExtensionAllowed("image.jpg"));
        assertTrue("JPEG should be allowed", ImageValidator.isExtensionAllowed("image.jpeg"));
        assertTrue("PNG should be allowed", ImageValidator.isExtensionAllowed("image.png"));
        assertTrue("GIF should be allowed", ImageValidator.isExtensionAllowed("image.gif"));
        assertTrue("BMP should be allowed", ImageValidator.isExtensionAllowed("image.bmp"));
        assertTrue("WebP should be allowed", ImageValidator.isExtensionAllowed("image.webp"));
        assertTrue("SVG should be allowed", ImageValidator.isExtensionAllowed("image.svg"));
        assertTrue("TIFF should be allowed", ImageValidator.isExtensionAllowed("image.tiff"));
        assertTrue("TIF should be allowed", ImageValidator.isExtensionAllowed("image.tif"));
    }

    @Test
    public void testExtensionValidation_CaseInsensitive() {
        assertTrue("Uppercase JPG should be allowed", ImageValidator.isExtensionAllowed("IMAGE.JPG"));
        assertTrue("Mixed case PnG should be allowed", ImageValidator.isExtensionAllowed("image.PnG"));
    }

    @Test
    public void testExtensionValidation_DisallowedExtensions() {
        assertFalse("EXE should not be allowed", ImageValidator.isExtensionAllowed("file.exe"));
        assertFalse("TXT should not be allowed", ImageValidator.isExtensionAllowed("file.txt"));
        assertFalse("PDF should not be allowed", ImageValidator.isExtensionAllowed("file.pdf"));
        assertFalse("No extension should not be allowed", ImageValidator.isExtensionAllowed("file"));
    }

    @Test
    public void testMimeTypeValidation_AllowedTypes() {
        assertTrue("image/jpeg should be allowed", ImageValidator.isMimeTypeAllowed("image/jpeg"));
        assertTrue("image/png should be allowed", ImageValidator.isMimeTypeAllowed("image/png"));
        assertTrue("image/gif should be allowed", ImageValidator.isMimeTypeAllowed("image/gif"));
        assertTrue("image/bmp should be allowed", ImageValidator.isMimeTypeAllowed("image/bmp"));
        assertTrue("image/webp should be allowed", ImageValidator.isMimeTypeAllowed("image/webp"));
        assertTrue("image/svg+xml should be allowed", ImageValidator.isMimeTypeAllowed("image/svg+xml"));
        assertTrue("image/tiff should be allowed", ImageValidator.isMimeTypeAllowed("image/tiff"));
    }

    @Test
    public void testMimeTypeValidation_DisallowedTypes() {
        assertFalse("application/pdf should not be allowed", ImageValidator.isMimeTypeAllowed("application/pdf"));
        assertFalse("text/plain should not be allowed", ImageValidator.isMimeTypeAllowed("text/plain"));
        assertFalse("video/mp4 should not be allowed", ImageValidator.isMimeTypeAllowed("video/mp4"));
    }

    @Test
    public void testMagicBytesValidation_JPEG() throws IOException {
        // JPEG magic bytes: FF D8 FF
        byte[] jpegBytes = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10};
        InputStream is = new ByteArrayInputStream(jpegBytes);
        assertTrue("Valid JPEG magic bytes should pass", ImageValidator.validateMagicBytes(is, "image/jpeg"));
    }

    @Test
    public void testMagicBytesValidation_PNG() throws IOException {
        // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
        byte[] pngBytes = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00};
        InputStream is = new ByteArrayInputStream(pngBytes);
        assertTrue("Valid PNG magic bytes should pass", ImageValidator.validateMagicBytes(is, "image/png"));
    }

    @Test
    public void testMagicBytesValidation_GIF87a() throws IOException {
        // GIF magic bytes: 47 49 46 38 37 61 (GIF87a)
        byte[] gifBytes = {0x47, 0x49, 0x46, 0x38, 0x37, 0x61, 0x00, 0x00};
        InputStream is = new ByteArrayInputStream(gifBytes);
        assertTrue("Valid GIF87a magic bytes should pass", ImageValidator.validateMagicBytes(is, "image/gif"));
    }

    @Test
    public void testMagicBytesValidation_GIF89a() throws IOException {
        // GIF magic bytes: 47 49 46 38 39 61 (GIF89a)
        byte[] gifBytes = {0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x00, 0x00};
        InputStream is = new ByteArrayInputStream(gifBytes);
        assertTrue("Valid GIF89a magic bytes should pass", ImageValidator.validateMagicBytes(is, "image/gif"));
    }

    @Test
    public void testMagicBytesValidation_BMP() throws IOException {
        // BMP magic bytes: 42 4D (BM)
        byte[] bmpBytes = {0x42, 0x4D, 0x00, 0x00, 0x00, 0x00};
        InputStream is = new ByteArrayInputStream(bmpBytes);
        assertTrue("Valid BMP magic bytes should pass", ImageValidator.validateMagicBytes(is, "image/bmp"));
    }

    @Test
    public void testMagicBytesValidation_WebP() throws IOException {
        // WebP magic bytes: RIFF....WEBP
        byte[] webpBytes = {0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 
                           0x57, 0x45, 0x42, 0x50};
        InputStream is = new ByteArrayInputStream(webpBytes);
        assertTrue("Valid WebP magic bytes should pass", ImageValidator.validateMagicBytes(is, "image/webp"));
    }

    @Test
    public void testMagicBytesValidation_TIFFLittleEndian() throws IOException {
        // TIFF magic bytes (little endian): 49 49 2A 00
        byte[] tiffBytes = {0x49, 0x49, 0x2A, 0x00, 0x00, 0x00};
        InputStream is = new ByteArrayInputStream(tiffBytes);
        assertTrue("Valid TIFF (little endian) magic bytes should pass", 
                  ImageValidator.validateMagicBytes(is, "image/tiff"));
    }

    @Test
    public void testMagicBytesValidation_TIFFBigEndian() throws IOException {
        // TIFF magic bytes (big endian): 4D 4D 00 2A
        byte[] tiffBytes = {0x4D, 0x4D, 0x00, 0x2A, 0x00, 0x00};
        InputStream is = new ByteArrayInputStream(tiffBytes);
        assertTrue("Valid TIFF (big endian) magic bytes should pass", 
                  ImageValidator.validateMagicBytes(is, "image/tiff"));
    }

    @Test
    public void testMagicBytesValidation_SVG_XML() throws IOException {
        // SVG with XML declaration: <?xml
        String svgContent = "<?xml version=\"1.0\"?><svg></svg>";
        byte[] svgBytes = svgContent.getBytes();
        InputStream is = new ByteArrayInputStream(svgBytes);
        assertTrue("Valid SVG with XML declaration should pass", 
                  ImageValidator.validateMagicBytes(is, "image/svg+xml"));
    }

    @Test
    public void testMagicBytesValidation_SVG_Direct() throws IOException {
        // SVG without XML declaration: <svg
        String svgContent = "<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>";
        byte[] svgBytes = svgContent.getBytes();
        InputStream is = new ByteArrayInputStream(svgBytes);
        assertTrue("Valid SVG without XML declaration should pass", 
                  ImageValidator.validateMagicBytes(is, "image/svg+xml"));
    }

    @Test
    public void testMagicBytesValidation_InvalidJPEG() throws IOException {
        // Invalid JPEG (wrong magic bytes)
        byte[] invalidBytes = {0x00, 0x00, 0x00, 0x00};
        InputStream is = new ByteArrayInputStream(invalidBytes);
        assertFalse("Invalid JPEG magic bytes should fail", 
                   ImageValidator.validateMagicBytes(is, "image/jpeg"));
    }

    @Test
    public void testMagicBytesValidation_MismatchedType() throws IOException {
        // JPEG magic bytes but claiming to be PNG
        byte[] jpegBytes = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0};
        InputStream is = new ByteArrayInputStream(jpegBytes);
        assertFalse("JPEG bytes with PNG MIME type should fail", 
                   ImageValidator.validateMagicBytes(is, "image/png"));
    }

    @Test
    public void testGetExtension() {
        assertEquals(".jpg", ImageValidator.getExtension("image.jpg"));
        assertEquals(".png", ImageValidator.getExtension("path/to/image.png"));
        assertEquals(".jpeg", ImageValidator.getExtension("IMAGE.JPEG"));
        assertEquals("", ImageValidator.getExtension("noextension"));
        assertEquals("", ImageValidator.getExtension(""));
        assertEquals("", ImageValidator.getExtension(null));
    }

    @Test
    public void testGetExtensionFromMimeType() {
        assertEquals(".jpg", ImageValidator.getExtensionFromMimeType("image/jpeg"));
        assertEquals(".png", ImageValidator.getExtensionFromMimeType("image/png"));
        assertEquals(".gif", ImageValidator.getExtensionFromMimeType("image/gif"));
        assertEquals(".bmp", ImageValidator.getExtensionFromMimeType("image/bmp"));
        assertEquals(".webp", ImageValidator.getExtensionFromMimeType("image/webp"));
        assertEquals(".svg", ImageValidator.getExtensionFromMimeType("image/svg+xml"));
        assertEquals(".tiff", ImageValidator.getExtensionFromMimeType("image/tiff"));
        assertEquals("", ImageValidator.getExtensionFromMimeType("unknown/type"));
        assertEquals("", ImageValidator.getExtensionFromMimeType(""));
        assertEquals("", ImageValidator.getExtensionFromMimeType(null));
    }

    @Test
    public void testValidationResult_Valid() {
        ImageValidator.ValidationResult result = new ImageValidator.ValidationResult();
        assertTrue("Empty result should be valid", result.isValid());
        assertEquals("No errors", 0, result.getErrors().size());
    }

    @Test
    public void testValidationResult_WithErrors() {
        ImageValidator.ValidationResult result = new ImageValidator.ValidationResult();
        result.addError("Error 1");
        result.addError("Error 2");
        
        assertFalse("Result with errors should not be valid", result.isValid());
        assertEquals("Should have 2 errors", 2, result.getErrors().size());
        assertTrue("Error message should contain both errors", 
                  result.getErrorMessage().contains("Error 1"));
        assertTrue("Error message should contain both errors", 
                  result.getErrorMessage().contains("Error 2"));
    }
}

package edu.pucmm;

import io.javalin.Javalin;

public class Main {
    public static void main(String[] args) {
        // Crea y configura la instancia de Javalin
        Javalin app = Javalin.create(config -> {
            // Indica a Javalin la carpeta de archivos estáticos
            config.staticFiles.add("/public");
        }).start(7070);  // Inicia en el puerto 7070

        // Opcional: Redirigir la raíz ("/") a "index.html"
        app.get("/", ctx -> {
            ctx.redirect("/index.html");
        });

        System.out.println("Servidor Javalin corriendo en http://localhost:7070");
    }
}

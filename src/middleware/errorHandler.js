export function mongoErrorHandler(err, req, res, next) {
// Mongoose Validation Error
    if (err.name === "ValidationError") {
        const errors = Object.values(err.errors).map(e => ({ field: e.path, msg: e.message }));
        return res.status(400).json({ 
        status: "fail", 
        message: errors[0]?.msg || "Errore di validazione", // per il front
        errors 
        });
    }

// Duplicate key (es. email già esistente)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(409).json({
            status: "fail",
            message: `${field} già in uso`
        });
    }
// CastError: ObjectId non valido
    if (err.name === "CastError") {
        return res.status(400).json({
            status: "fail",
            message: "ID non valido"
        });
    }
// Altri errori
    console.error("Errore interno del server:", err);
    return res.status(500).json({
        status: "error",
        message: err.message || "Errore interno del server"
    });
}
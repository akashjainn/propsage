export function timing(req, res, next) {
    const start = performance.now();
    res.on('finish', () => {
        const ms = (performance.now() - start).toFixed(1);
        // Basic structured log
        console.log(JSON.stringify({ evt: 'http', path: req.path, method: req.method, status: res.statusCode, ms }));
    });
    next();
}

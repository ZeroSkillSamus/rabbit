const winston = require('winston');

const initLogging = () => {
    const logger = winston.createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        ),
        transports: [
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
            })
        ]
    });

    return logger;
};

const logError = (error) => {
    const logger = initLogging();
    logger.error({
        timestamp: new Date().toISOString(),
        message: 'process exited with ERROR',
        error: error.toString(),
        stack: error.stack,
        environment: process.env.NODE_ENV || 'development'
    });
};

const requestStats = (req, res, next) => {
    const { ip, path, method } = req;
    const logger = initLogging();
    logger.info(`${ip} - ${method} ${path}`, {
        ip,
        method,
        path,
        userAgent: req.get('user-agent'),
        environment: process.env.NODE_ENV || 'development'
    });
    next();
};

module.exports = {
    initLogging,
    logError,
    requestStats
};

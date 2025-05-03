require('dotenv').config();

module.exports = {
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    host: process.env.DB_HOST,
    dialect: 'mysql',
    dialectOptions: {
        // For MySQL 8.0 and above
        authPlugins: {
            mysql_native_password: () => require('mysql2/lib/auth_plugins/mysql_native_password')
        }
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    logging: false
};

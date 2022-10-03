import pg from "pg";
import dotenv from "dotenv";
dotenv.config();
console.log(process.env.DATABASE_URL);
const { Pool } = pg;

const connection = new Pool({
	/* 	user: "postgres",
	password: "123456",
	host: "localhost",
	port: 5432,
	database: "meu_banco_de_dados", */
	connectionString: process.env.DATABASE_URL,
});

export default connection;

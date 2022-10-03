import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import joi from "joi";
dotenv.config();

import connection from "./database.js";

const server = express();
server.use(express.json());
server.use(cors());

//CRUD de Categorias
server.get("/categories", async (req, res) => {
	try {
		const Myquery = await connection.query(`SELECT * FROM categories;`);

		res.send(Myquery.rows);
	} catch (error) {
		console.error(error);
	}
});
const newCategorieNameSchema = joi.object({
	name: joi.string().required(),
});
server.post("/categories", async (req, res) => {
	const nameValidation = newCategorieNameSchema.validate(req.body.name, {
		abortEarly: false,
	});
	if (nameValidation.error) {
		nameValidation.error.details.map((error) => error.message);
		return res.status(400).json({ status: 400, message: erros });
	}
	const name = req.body.name;

	try {
		const query = await connection.query(`SELECT ${name} FROM categories;`);
		if (query) {
			return res.status(409).json;
		}
		await connection.query(
			`
			INSERT INTO categories (name) 
			VALUES ('$1');`,
			[name]
		);
		res.status(201);
	} catch (error) {
		console.error(error);
	}
});

//CRUD de Jogos
server.get("/games", async (req, res) => {
	try {
		const query = connection.query(`
			SELECT games.*, categories.name AS "categoryName" 
			FROM games JOIN categories 
			ON games."categoryId"=categories.id;
		`);
		return res.send(query);
	} catch (error) {
		console.error(error);
	}
});
const newGameSchema = joi.object({
	name: joi.string().required(),
	image: joi.link().required(),
	stockTotal: joi.number().required().greater(0),
	categoryId: joi.number().required(),
	pricePerDay: joi.number().required().greater(0),
});
server.post("/games", async (req, res) => {
	const newGame = req.body;
	const validation = newGameSchema.validate(newGame, { abortEarly: false });

	if (validation.error) {
		validation.error.details.map((error) => error.message);
		return res.status(400).json({ status: 400, message: erros });
	}
	try {
		const query = await connection.query(`
			SELECT ${newGame.name} FROM games;`);
		if (query) {
			return res.sendStatus(409);
		}
		await connection.query(
			`
			INSERT INTO games 
			(name, image, "stockTotal", "categoryId", "pricePerDay") 
			VALUES ($1, $2, $3, $4, $5, );`,
			[
				newGame.name,
				newGame.image,
				newGame.stockTotal,
				newGame.categoryId,
				newGame.pricePerDay,
			]
		);
		return res.sendStatus(201);
	} catch (error) {
		console.log(error);
	}
});

//CRUD de Clientes
server.get("/customers", async (req, res) => {
	const cpf = req.query.cpf;
	try {
		if (cpf) {
			const query = await connection.query(`
			SELECT * FROM customers WHERE cpf = LIKE '${cpf}%';`);
			return res.send(query.rows);
		}
		const Myquery = await connection.query(`SELECT * FROM customers;`);
		res.send(Myquery.rows);
	} catch (error) {
		console.error(error);
	}
});
server.get("/customers/:id", async (req, res) => {
	const id = req.params.id;
	try {
		const query = connection.query(`
		SELECT * FROM customers WHERE id = ${id};`);
		if (!query) {
			return res.sendStatus(404);
		}
		res.send(query.rows);
	} catch (error) {
		console.error(error);
	}
});
const newCustomerSchema = joi.object({
	name: joi.string().required(),
	phone: joi.string().required().min(8).max(11),
	cpf: joi.number().required().min(11),
	birthday: joi.date(),
});
server.post("/customers", async (req, res) => {
	const newCustomer = {
		name: req.body.name,
		phone: req.body.phone,
		cpf: req.body.cpf,
		birthday: req.body.birthday,
	};

	const validate = newCustomerSchema.validate(newCustomer, {
		abortEarly: false,
	});
	if (validate.error) {
		validation.error.details.map((error) => error.message);
		return res.status(400).json({ status: 400, message: erros });
	}

	try {
		const query = await connection.query(
			` SELECT * FROM customers WHERE cpf = '${newCustomer.cpf}' `
		);
		if (query) {
			return res.sendStatus(409);
		}
		await connection.query(
			`
			INSERT INTO customers (name, phone, cpf, birthday) 
			VALUES (' $1, $2, $3, "$4",
			) ;`,
			[
				newCustomer.name,
				newCustomer.phone,
				newCustomer.cpf,
				newCustomer.birthday,
			]
		);
		return res.sendStatus(201);
	} catch (error) {
		console.log(error);
	}
});
server.put("/customers/:id", async (req, res) => {
	const id = req.params.id;
	const uptCustomer = {
		name: req.body.name,
		phone: req.body.phone,
		cpf: req.body.cpf,
		birthday: req.body.birthday,
	};
	const validate = newCustomerSchema.validate(uptCustomer, {
		abortEarly: false,
	});
	if (validate.error) {
		validation.error.details.map((error) => error.message);
		return res.status(400).json({ status: 400, message: erros });
	}

	try {
		await connection.query(`
			UPDATE customers SET (
				name= '${uptCustomer.name}', 
				phone= ${uptCustomer.phone}, 
				cpf= ${uptCustomer.cpf}, 
				birthday= '${uptCustomer.birthday}', 
			) WHERE id = ${id};
		`);

		res.sendStatus(200);
	} catch (error) {
		console.error(error);
	}
});

//CRUD de Alugueis
server.get("/rentals", async (req, res) => {
	try {
		const query = connection.query(`
		SELECT rentals.*,
		customers.id, customers.name,
		games.id, games.name, games."categoryId"
		FROM rentals
		JOIN customers ON rentals."customerId"=customers.id
		JOIN games ON rentals."gameId"=games.id ;
		`);

		res.send(query.rows);
	} catch (error) {
		console.error(error);
	}
});
server.post("/rentals", async (req, res) => {
	const newReq = {
		customerId: req.params.customerId,
		gameId: req.params.gameId,
		daysRented: req.params.daysRented,
	};
	if (!(newReq.daysRented > 0)) {
		return res.sendStatus(400);
	}

	try {
		const queryCustomer = await connection.query(`
		SELECT * FROM customers WHERE customerId = '${newReq.customerId}'		
		`);
		const queryGame = await connection.query(`
		SELECT * FROM games WHERE gameId = '${newReq.gameId}'
		`);
		if (!queryCustomer || !queryGame) {
			return res.sendStatus(400);
		}
		const gameCost = queryGame.pricePerDay * newReq.daysRented;
		await connection.query(
			`
		INSERT INTO rentals (
			"customerId",
			"gameId",
			"rentDate",
			"daysRented",
			"returnDate",
			"originalPrice",
			"delayFee",
			)
			VALUES (
				$1,
				$2,
				NOW(),
				$3,
				null,
				$4,
				null
			);`,
			[newReq.customerId, newReq.gameId, newReq.daysRented, gameCost]
		);
		res.sendStatus(201);
	} catch (error) {
		console.error(error);
	}
});
server.post("/rentals/:id/return", async (req, res) => {});
server.delete("/rentals/:id", async (req, res) => {
	try {
	} catch (error) {
		console.error(error);
	}
});

server.get("/status", (req, res) => {
	res.send("I'm Alive!");
});

server.listen(4000, () => {
	console.log("listening on port " + process.env.PORT);
});

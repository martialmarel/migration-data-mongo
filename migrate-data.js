'use strict';

const mongodb = require('mongodb');
const async = require('async');
const benchmark = require('./helpers/benchmark');


// get command line argument, number of customers inserted by one query 
const args = process.argv.slice(2); // remove node and scriptname
if (typeof args[0] === 'undefined') {
	console.error('Parameters required : Number of customers to insert into a database at a time'); // eslint-disable-line
	process.exit(1);
}
const customersPerQuery = parseInt(args[0], 10);


// initialize paths
const customerData= require('./data/m3-customer-data.json'); 
const customerAddress = require('./data/m3-customer-address-data.json');
if (customerData.length != customerAddress.length) {
	console.error('Error : The number of records is different between files : client and address.'); // eslint-disable-line
	process.exit(1);
}


// initialize Database
const database = {
	driver: 'mongodb',
	host: 'localhost',
	port: '27017',
	name: 'edx-course-db',
	collections: [
		{type: 'customer', name: 'edx-course-customers'}
	],
	getDSN: function() {
		return `${this.driver}://${this.host}:${this.port}/`;
	},
	getCollectionName: function(type) {
		const collection =  this.collections.find(collection => collection.type === type);
		if (collection === undefined) {
			throw new Error(`Database collection type : ${type} does not exist`);
		}

		return collection.name;
	}
};

// format data (combine customer data and address)	
const customers = [];
customerData.forEach((partialCustomer, index) => {
	const partialAddress = customerAddress[index];
	const customer = { ...partialCustomer, ...partialAddress };
	customers.push(customer);
});


// compute parallel task
const tasks = [];
const customerSize = parseInt(customers.length, 10);
const numberParallelTask = customerSize / customersPerQuery;


mongodb.MongoClient.connect(database.getDSN(), (error, client) => {
	if (error) { return process.exit(1); }
	const db = client.db(database.name);
	const customerCollection = db.collection(database.getCollectionName('customer'));

	// define a task : is query insert of multiple customer 
	const fnParrallelDBInsert = (callback) => {
		const customersSeries = customers.splice(0, customersPerQuery);
		customerCollection.insertMany(customersSeries, (error) => {
			if (error) { return process.exit(1); }
			callback();
		});
	};
	for (let i=0; i < numberParallelTask; i++) {
		tasks.push(fnParrallelDBInsert);
	}

	benchmark.start();
	//run all tasks in paralell, when done display status and benchmark script execution (time, memory)
	async.parallel(tasks, (error, results) => {
		if (error) { return process.exit(1); }
		console.log(`${results.length} queries, with ${customersPerQuery} customer per query`); // eslint-disable-line
		benchmark.end();
		client.close();
	});
});

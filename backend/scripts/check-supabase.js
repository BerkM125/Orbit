const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkData() {
	console.log('🔍 Checking Supabase connection...');
	console.log('URL:', process.env.SUPABASE_URL);
	console.log('Service Key exists:', !!process.env.SUPABASE_SERVICE_KEY);

	try {
		const { data, error } = await supabase.from('documents').select('*').limit(5);

		if (error) {
			console.error('❌ Error querying documents table:', error);
		} else {
			console.log('✅ Successfully connected to Supabase');
			console.log('📊 Found', data.length, 'rows in documents table');
			if (data.length > 0) {
				console.log('📄 Sample row:', JSON.stringify(data[0], null, 2));
			}
		}
	} catch (err) {
		console.error('❌ Connection error:', err.message);
	}
}

async function countRows() {
	try {
		const { count, error } = await supabase
			.from('documents')
			.select('*', { count: 'exact', head: true });

		if (error) {
			console.error('❌ Error counting rows:', error);
		} else {
			console.log(`📊 Total rows in documents table: ${count}`);
		}
	} catch (err) {
		console.error('❌ Error counting rows:', err.message);
	}
}

async function checkTableSchema() {
	try {
		const { data, error } = await supabase
			.from('documents')
			.select('column_name, data_type', { count: 'exact', head: true })
			.limit(0); // Fetch schema without data

		if (error) {
			console.error('❌ Error fetching schema:', error);
		} else if (data && data.length > 0) {
			console.log('📊 documents table schema:');
			data.forEach((col) => console.log(`  - ${col.column_name} (${col.data_type})`));
		} else {
			console.log('📊 documents table exists');
			console.log('📄 Table is empty but exists');
		}
	} catch (err) {
		console.error('❌ Error checking schema:', err.message);
	}
}

// Run all checks
checkData();
countRows();
checkTableSchema();

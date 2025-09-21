class LocalData {
	dict = $state({});
	user = $state({
		first_name: 'SAMPLE',
		last_name: 'USERNAME',
		userId: 'sample-username',
		linkedin_url: 'https://www.linkedin.com/in/sample-username/',
		bio: 'SDE @ Hewlett Packard Enterprise',
		headshot_image:
			'https://media.licdn.com/dms/image/D4D03AQHjv1eXHk1m7g/profile-displayphoto-shrink_800_800/0/1678887038471?e=1701302400&v=beta&t=ZKJ3nY3c1kC8qfO2nF9lJd8nG4p6Ykz8b9rY3F4g6Uo',
		location: {
			latitude: 47.6062,
			longitude: -122.3321
		}
	});
	
	// Helper method to get full name
	getFullName() {
		return `${this.user.first_name} ${this.user.last_name}`.trim();
	}
}

export const localData = new LocalData();

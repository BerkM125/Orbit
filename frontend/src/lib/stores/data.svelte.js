class LocalData {
	dict = $state({});
	user = $state({});

	// Helper method to get full name
	getFullName() {
		return `${this.user.first_name} ${this.user.last_name}`.trim();
	}
}

export const localData = new LocalData();

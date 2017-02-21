import request from 'superagent'
const SERVER_URI = 'https://nominatim.openstreetmap.org'

export default {
	onSearch(value) {
		return request.get(`${SERVER_URI}/search/${value}`)
			.query({
				format: 'json',
				addressdetails: 1,
				'accept-language': 'en',
				//limit: 20,
				polygon_geojson: 1
			})
	}
}
//http://nominatim.openstreetmap.org/search/ufa?format=json&addressdetails=1&limit=1&polygon_svg=1
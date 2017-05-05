import React from 'react'
import ReactDOM from 'react-dom'
import actions from './actions'
import isEmpty from 'lodash.isempty'
import simplify from './simplify'

import explode from 'turf-explode'
import convex from 'turf-convex'
import concave from 'turf-concave'

import 'leaflet'
import 'leaflet-draw'

class App extends React.Component {
	constructor(props, context) {
		super(props, context)
		this.map = null
		this.state = {
			canSave: false,
			search: null,
			selected: {},
			query: '',
			isLoading: false,
			simplify: false
		}
	}

	componentDidMount() {
		this.initMap()
	}

	componentDidUpdate(nextProps, nextState) {
		if (this.state.selected && nextState.simplify !== this.state.simplify) {
			this.renderObjectOnMap(this.state.selected)
		}
	}

	onSubmit = (e) => {
		e.preventDefault()
		const {query, isLoading} = this.state
		const types = ['Polygon', 'MultiPolygon']

		if (!query || isLoading) return

		this.setState({isLoading: true})

		actions.onSearch(query).end((err, res) => {
			if (err) {
				return console.log(err);
			}
			const search = res.body.filter(item => types.includes(item.geojson.type))
				.filter((item, index, self) => {
					const copies = self.filter(i => i.display_name === item.display_name)
					const hasBoundary = copies.some(i => i.class === 'boundary')
					const hasPlace = copies.some(i => i.class === 'place')

					return copies.length > 1
						? (hasBoundary && item.class === 'boundary' ||
							!hasBoundary && hasPlace && item.class === 'place' ||
							!hasBoundary && !hasPlace && item.osm_type === copies[0].osm_type)
							? true
							: false
						: true
				})
			this.setState({
				search,
				isLoading: false
			})
		})
	}

	onSelect = (selected) => {
		const {query} = this.state
		this.setState({
			canSave: true,
			selected,
			search: null
		})
		console.log('QUERY: ', query)
		console.log('RESULT: ', selected)
		console.log('=====')
		this.renderObjectOnMap(selected)
	}

	onTextChange = (e) => {
		const {value} = e.target
		this.setState({
			query: value,
			search: null
		})
	}

	onSaveLocation = () => {
		const polygons = []

		this.featureGroup.eachLayer(layer => polygons.push(layer.toGeoJSON().geometry.coordinates))

		polygons.length && console.log('POLYGON: ', polygons)
	}

	renderSearchForm = () => {
		const {query} = this.state

		return (
			<form className="search__form"
				onSubmit={this.onSubmit}>
				<label className="search__label">
					Search:
				</label>
				<input className="search__input"
					onChange={this.onTextChange}
					placeholder="Search..."
					type="text"
					value={query} />
				<input type="submit"
					className="search__submit"
					value="..." />
				{this.renderSearchResults()}
			</form>
		)
	}

	renderSearchResults = () => {
		const {search} = this.state
		if (!search) return
console.log('Search results: ', search)
		return (
			<div className="search__results">
				{search.length
					? search.map(item =>
						<div className="search__item"
							key={item.place_id}
							onClick={this.onSelect.bind(this, item)}>
							{item.display_name}
						</div>
					)
					: <div className="search__item">
						Nothing was found
					</div>
				}
			</div>
		)
	}

	renderDetails = () => {
		const {selected} = this.state

		if (isEmpty(selected)) return

		return (
			<div className="search__details">
				<div className="search__details-bg">
					{selected.display_name}
					<p>Class: {selected.class}</p>
					<p>Type: {selected.type}</p>
					<p>Lat/Lon: {selected.lat}/{selected.lon}</p>
					<p>geoJSON type: {selected.geojson.type}</p>
				</div>
			</div>
		)
	}

	initMap = () => {
		this.map = L.map('map').setView([51.505, -0.09], 13)
		this.featureGroup = L.featureGroup().addTo(this.map)
		this.drawControl = new L.Control.Draw({
			draw: {
				polygon: true,
				polyline: false,
				rectangle: false,
				circle: false,
				marker: false
			},
			edit: {
				featureGroup: this.featureGroup,
				// poly: {
				// 	allowIntersection: false
				// }
			}
		}).addTo(this.map)

		L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
			maxZoom: 18,
			attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
				'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
				'Imagery © <a href="http://mapbox.com">Mapbox</a>',
			id: 'mapbox.streets'
		}).addTo(this.map)

		this.map.on('draw:created', (e) => {
			this.setState({canSave: true})
			this.featureGroup.addLayer(e.layer)
		})
		this.map.on('draw:drawstart', (e) => {
			this.setState({canSave: false})
			this.featureGroup.clearLayers()
		})
	}

	simplify = (geojson) => {
		const coordinates = geojson.coordinates[0]
		const distance = this.getDistance(coordinates)
		const tolerance = distance/100
		const simplifiedCoords = simplify(coordinates, tolerance, false)
		console.log('Simplified: ', coordinates.length, '->', simplifiedCoords.length)
		return Object.assign({}, geojson, {coordinates: [simplifiedCoords]})
	}

	simplifyMultyPolygon = (geojson) => {
		const {coordinates} = geojson
		// const flattened = flatten(geojson)
		// console.log('flattened: ', flattened)

		const updatedCoordinates = coordinates.map(feature => {
			const flattenCoordinates = this.flatten(feature)
			//console.log('!!!', feature.length, flattenFeature.length)
			const simplifiedCoords = simplify(flattenCoordinates, 0.001, false)
			console.log('-> flattenCoordinates:', flattenCoordinates.length);
			console.log('-> simplifiedCoords:', simplifiedCoords.length)
			return [simplifiedCoords]
		})

		const exploded = explode(geojson)
		console.log('exploded: ', exploded)

		const convexed = convex(exploded)
		console.log('convexed:', convexed)

		//var fc = turf.featurecollection(geojson);
		//var concaved = turf.concave(exploded,  0.5, 'kilometers');

		//const concaved = turf.concave(exploded, 0.001, 'kilometers')
		//console.log('concaved:', concaved)

		return Object.assign({}, geojson, {
			coordinates: convexed.geometry.coordinates,
			type: convexed.geometry.type
		})
// console.log('====', {geojson, updatedCoordinates});
// 		return Object.assign({}, geojson, {
// 			coordinates: updatedCoordinates
// 		})
	}

	getDistance = (points) => {
		let distance = 0
		for (let i = 0; i < points.length - 1; i++) {
			distance += this.twoPointsDistance(points[i], points[i + 1])
		}
		return distance
	}

	twoPointsDistance = (point1, point2) => {
		return Math.sqrt(Math.pow(point1[0] - point2[0], 2) + Math.pow(point1[1] - point2[1], 2))
	}

	flatten = (array) => {
		const flat = [].concat(...array)
		return flat.some(arr => !this.isCoordinates(arr)) ? this.flatten(flat) : flat
	}

	isCoordinates = (arr) => {
		return Array.isArray(arr) &&
			arr.length === 2 &&
			typeof(arr[0]) === 'number' &&
			typeof(arr[1]) === 'number'
	}

	renderObjectOnMap = (obj) => {
		const {boundingbox, geojson, lat, lon} = obj
		const {coordinates} = geojson
		const bounds = [
			[boundingbox[0], boundingbox[2]],
			[boundingbox[1], boundingbox[3]]
		]

		this.map.fitBounds(bounds)
		this.setState({canSave: true})
		this.featureGroup.clearLayers()

		const geoJsonObject = this.state.simplify
			? geojson.type === 'MultiPolygon'
				? this.simplifyMultyPolygon(geojson)
				: this.simplify(geojson)
			: geojson

		console.log('geoJsonObject:', geoJsonObject)

		if (!isEmpty(geoJsonObject)) {
			const myStyle = {
				"color": "#3388ff",
				"weight": 4,
				"opacity": 0.5
			}

			// 1. render in featureGroup
			L.geoJson(geoJsonObject, {
				style: myStyle,
				onEachFeature: (feature, layer) => {
					this.featureGroup.addLayer(layer)
				}
			})

			// 2. render as geoJSON layer
			//L.geoJSON([geojson], {style: myStyle}).addTo(this.map);
		}
	}

	renderMap = () => {
		return (
			<div id="map" className="search__map" />
		)
	}

	renderSpinner = () => {
		const {isLoading} = this.state

		if (!isLoading) return null

		return (
			<div className="spinner">
				<div className="rect1" />
				<div className="rect2" />
				<div className="rect3" />
				<div className="rect4" />
				<div className="rect5" />
			</div>
		)
	}

	renderButtons = () =>
		<div className="search__buttons">
			<button className="search__button"
				onClick={() => {
					this.setState({simplify: !this.state.simplify})
				}}>
				{`Simplify: ${this.state.simplify ? 'off': 'on'}`}
			</button>
			{this.state.canSave && (
				<button className="search__button"
					onClick={this.onSaveLocation}>
					Save
				</button>
			)}
		</div>

	render () {
		return (
			<div className="search">
				{this.renderButtons()}
				{this.renderSearchForm()}
				{this.renderDetails()}
				{this.renderMap()}
				{this.renderSpinner()}
			</div>
		)
	}
}

ReactDOM.render(<App />, document.getElementById('app'))
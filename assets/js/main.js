import React from 'react'
import ReactDOM from 'react-dom'
import actions from './actions'
import isEmpty from 'lodash.isempty'
import 'leaflet'

class App extends React.Component {
	constructor(props, context) {
		super(props, context)
		this.map = null
		this.state = {
			search: [],
			selected: {},
			query: '',
			isLoading: false
		}
	}

	componentDidMount() {
		this.initMap()
	}

	onSubmit = (e) => {
		e.preventDefault()
		const {query, isLoading} = this.state

		if (!query || isLoading) return

		this.setState({isLoading: true})

		actions.onSearch(query).end((err, res) => {
			if (err) {
				return console.log(err);
			}
			this.setState({
				search: res.body,
				isLoading: false
			})
		})
	}

	onSelect = (selected) => {
		const {query} = this.state
		this.setState({
			selected,
			search: []
		})
		console.log('QUERY: ', query)
		console.log('RESUL: ', selected)
		console.log('=====')
		this.renderObjectOnMap(selected)
	}

	onTextChange = (e) => {
		const {value} = e.target
		this.setState({
			query: value,
			search: []
		})
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
		if (!search.length) return

		return (
			<div className="search__results">
				{search.map(item =>
					<div className="search__item"
						key={item.place_id}
						onClick={this.onSelect.bind(this, item)}>
						{item.display_name}
					</div>
				)}
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

		L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
			maxZoom: 18,
			attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
				'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
				'Imagery © <a href="http://mapbox.com">Mapbox</a>',
			id: 'mapbox.streets'
		}).addTo(this.map);
	}

	renderObjectOnMap = (obj) => {
		const {boundingbox, geojson, lat, lon} = obj
		const bounds = [
			[boundingbox[0], boundingbox[2]],
			[boundingbox[1], boundingbox[3]]
		]

		this.map.fitBounds(bounds);

		if (!isEmpty(geojson)) {
			var myStyle = {
				"color": "#20b5e1",
				"weight": 2,
				"opacity": 0.9
			}

			L.geoJSON([geojson], {style: myStyle}).addTo(this.map);
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

	render () {
		return (
			<div className="search">
				{this.renderSearchForm()}
				{this.renderDetails()}
				{this.renderMap()}
				{this.renderSpinner()}
			</div>
		)
	}
}

ReactDOM.render(<App />, document.getElementById('app'))